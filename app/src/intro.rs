//! First-visit greeting: written in script on the plate, then reeled into the point the plate's
//! line is drawn out of. The plate draws it into its own engraving (plate/gpu.rs), so the
//! greeting is under the same paper, grain and glass as everything after it.

use std::borrow::Cow;

use gpui_wgpu::WgpuContextHandle;
use swash::FontRef;
use swash::scale::{Render as Raster, ScaleContext, Source};
use swash::shape::ShapeContext;
use swash::zeno::{Format, Vector};
use web_time::Instant;

/// The greeting, a line each: the first leads, large; the others follow, smaller.
pub const LINES: [&str; 2] = [
    "Hi, I am Matthias.",
    "I\u{2019}m so glad you\u{2019}re here.",
];
/// how large the following lines are against the first
const FOLLOW: f32 = 0.6;

/// atlas px per em: large enough that the text block is never magnified
const FONT: f32 = 128.0;
const PAD: usize = 8;
/// seconds before the pen touches the paper, and how long it writes
const WRITE_AT: f32 = 0.45;
/// the pen writes each line in a beat plus its share of this, longer lines taking longer,
/// with a breath after each line (the lead's longer)
const WRITE_BEAT: f32 = 0.3;
const WRITE_SHARE: f32 = 3.2;
const BREATHS: [f32; 2] = [0.5, 0.3];
/// seconds the finished greeting rests before it falls: long enough to read the last line
const REST: f32 = 0.9;
/// keep in step with intro.wgsl: the last of the sentence is reeled in REEL_AT + REEL after
/// it starts to lift
const FALL: f32 = 0.7 + 1.5;
/// how far into the fall the plate's pen sets off: as the coil starts closing on the point, so
/// the line is already coming out of it when the last of the sentence goes in (intro.wgsl's
/// REEL_AT + REEL * CLOSE_AT)
const DRAW_FROM: f32 = 0.7 + 1.5 * 0.55;

#[repr(C)]
#[derive(Clone, Copy, bytemuck::Pod, bytemuck::Zeroable)]
struct Uniforms {
    res: [f32; 2],
    t: f32,
    s_a: f32,
    yc: f32,
    atlas_h: f32,
    atlas_w: f32,
    head: f32,
    hair: f32,
    text_len: f32,
    fall_t0: f32,
    sink: f32,
    ink: [f32; 4],
}

#[repr(C)]
#[derive(Clone, Copy, bytemuck::Pod, bytemuck::Zeroable)]
struct Vertex {
    u: f32,
    side: f32,
    pa: [f32; 2],
    gap: f32,
    /// the row's size against the lead line
    k: f32,
}

/// The greeting shaped and rasterized once into a single-row coverage atlas.
struct Atlas {
    width: usize,
    height: usize,
    /// mip chain, level 0 first
    levels: Vec<Vec<u8>>,
    /// text length in atlas px
    len: f32,
    /// band centre: the middle of the x-height
    yc: f32,
    /// word gaps as [start, end) in atlas px, where rows may break, and whether a line ends there
    spaces: Vec<(f32, f32, bool)>,
    /// which atlas columns carry ink: a row is centred on its ink, not its advances (the
    /// script's swash capitals and the side padding would pull it off true)
    inked: Vec<bool>,
    /// the pen's schedule: for each line, [start, end) in atlas px and [from, to) in seconds
    pen: Vec<(f32, f32, f32, f32)>,
    /// seconds the whole greeting takes to write
    write_for: f32,
}

impl Atlas {
    /// Where the pen is at `t` seconds after it touches the paper, atlas px.
    fn head(&self, t: f32) -> f32 {
        let mut head = 0.0;
        for &(a, b, t0, t1) in &self.pen {
            if t < t0 {
                break;
            }
            let x = ((t - t0) / (t1 - t0)).clamp(0.0, 1.0);
            // a hand's pace: easing into and out of each line, steady through the middle
            let e = 0.5 * x + 0.5 * x * x * (3.0 - 2.0 * x);
            head = a + (b - a) * e;
        }
        head
    }
}

impl Atlas {
    fn schedule(spaces: &[(f32, f32, bool)], len: f32) -> (Vec<(f32, f32, f32, f32)>, f32) {
        let mut lines = Vec::new();
        let mut start = 0.0;
        for &(a, b, ends) in spaces {
            if ends {
                lines.push((start, a));
                start = b;
            }
        }
        lines.push((start, len));
        let total: f32 = lines.iter().map(|(a, b)| b - a).sum::<f32>().max(1.0);
        let mut t = 0.0;
        let mut pen = Vec::new();
        for (i, (a, b)) in lines.into_iter().enumerate() {
            let dur = WRITE_BEAT + WRITE_SHARE * (b - a) / total;
            pen.push((a, b, t, t + dur));
            t += dur + BREATHS.get(i).copied().unwrap_or(0.0);
        }
        let end = pen.last().map(|p| p.3).unwrap_or(0.0);
        (pen, end)
    }

    fn build() -> Self {
        let font = FontRef::from_index(crate::fonts::script(), 0).expect("script face");
        let metrics = font.metrics(&[]).scale(FONT);

        let mut shape = ShapeContext::new();
        let mut shaper = shape.builder(font).size(FONT).build();
        let text = LINES.join(" ");
        // the gaps where one line ends and the next begins
        let mut ends = Vec::new();
        for (i, line) in LINES.iter().enumerate().take(LINES.len() - 1) {
            let before: usize = LINES[..i].iter().map(|l| l.split(' ').count()).sum();
            ends.push(before + line.split(' ').count() - 1);
        }
        shaper.add_str(&text);
        let mut glyphs = Vec::new();
        let mut spaces = Vec::new();
        let mut pen = 0.0f32;
        shaper.shape_with(|cluster| {
            let start = pen;
            for g in cluster.glyphs {
                glyphs.push((g.id, pen + g.x, g.y));
                pen += g.advance;
            }
            if cluster.info.is_whitespace() {
                spaces.push((start, pen));
            }
        });

        let asc = metrics.ascent.ceil();
        let desc = metrics.descent.abs().ceil();
        // this hand's strokes overhang their advances (a final `g` sweeps well past its box)
        let side = PAD + (FONT * 0.5) as usize;
        let width = pen.ceil() as usize + side * 2;
        let height = (asc + desc) as usize + PAD * 2;
        let baseline = PAD as f32 + asc;
        let mut data = vec![0u8; width * height];

        let mut scale = ScaleContext::new();
        let mut scaler = scale.builder(font).size(FONT).hint(false).build();
        for (id, x, y) in glyphs {
            let x = x + side as f32;
            let Some(img) = Raster::new(&[Source::Outline])
                .format(Format::Alpha)
                .offset(Vector::new(x.fract(), 0.0))
                .render(&mut scaler, id)
            else {
                continue;
            };
            let p = img.placement;
            let ox = x.floor() as i32 + p.left;
            let oy = (baseline - y).round() as i32 - p.top;
            for row in 0..p.height as i32 {
                for col in 0..p.width as i32 {
                    let (dx, dy) = (ox + col, oy + row);
                    if dx < 0 || dy < 0 || dx as usize >= width || dy as usize >= height {
                        continue;
                    }
                    let src = img.data[(row * p.width as i32 + col) as usize];
                    let dst = &mut data[dy as usize * width + dx as usize];
                    // script strokes overlap where letters join: keep the stronger coverage
                    *dst = (*dst).max(src);
                }
            }
        }

        let x_height = if metrics.x_height > 0.0 {
            metrics.x_height
        } else {
            FONT * 0.3
        };
        let inked = (0..width)
            .map(|x| (0..height).any(|y| data[y * width + x] > 24))
            .collect();
        Self {
            width,
            height,
            inked,
            levels: crate::plate::mips(data, width, height, 1, usize::MAX),
            len: pen + side as f32 * 2.0,
            yc: baseline - x_height * 0.5,
            spaces: Vec::new(),
            pen: Vec::new(),
            write_for: 0.0,
        }
        .with_spaces(
            spaces
                .into_iter()
                .enumerate()
                .map(|(i, (a, b))| (a + side as f32, b + side as f32, ends.contains(&i)))
                .collect(),
        )
    }

    /// The middle of the ink in [a, b) atlas px (the middle of the span if it has none).
    fn ink_mid(&self, a: f32, b: f32) -> f32 {
        let cols = (a.max(0.0) as usize)..(b.ceil() as usize).min(self.inked.len());
        let first = cols.clone().find(|&x| self.inked[x]);
        let last = cols.rev().find(|&x| self.inked[x]);
        match (first, last) {
            (Some(f), Some(l)) => (f + l + 1) as f32 * 0.5,
            _ => (a + b) * 0.5,
        }
    }

    fn with_spaces(mut self, spaces: Vec<(f32, f32, bool)>) -> Self {
        let (pen, write_for) = Self::schedule(&spaces, self.len);
        self.spaces = spaces;
        self.pen = pen;
        self.write_for = write_for;
        self
    }

    /// The greeting's rows as [start, end) in atlas px with their line's size: each line on a
    /// row of its own, wrapped (greedily, at word gaps) only if it's wider than `max` screen px.
    fn rows(&self, max: f32, s_a: f32) -> Vec<(f32, f32, f32)> {
        let mut rows = Vec::new();
        let mut start = 0.0;
        let mut line = 0usize;
        let mut fit: Option<(f32, f32)> = None;
        let k_of = |line: usize| if line == 0 { 1.0 } else { FOLLOW };
        for &(a, b, ends) in &self.spaces {
            let room = max / (s_a * k_of(line));
            if a - start > room {
                if let Some((fa, fb)) = fit.take() {
                    rows.push((start, fa, k_of(line)));
                    start = fb;
                }
            }
            if ends {
                rows.push((start, a, k_of(line)));
                start = b;
                line += 1;
                fit = None;
            } else if a - start <= max / (s_a * k_of(line)) {
                fit = Some((a, b));
            }
        }
        rows.push((start, self.len, k_of(line)));
        rows
    }
}

/// Everything about the layout that depends on the viewport.
struct Layout {
    size: gpui::Size<gpui::DevicePixels>,
    uniforms: Uniforms,
    vertices: Vec<Vertex>,
}

impl Layout {
    /// Laid out for the plate's engraving: `size` device px at `dpr`, its spiral starting `lift`
    /// device px above the middle, its turns `d` device px apart.
    fn new(
        atlas: &Atlas,
        size: gpui::Size<gpui::DevicePixels>,
        dpr: f32,
        lift: f32,
        d: f32,
    ) -> Self {
        let (w, h) = (size.width.0 as f32, size.height.0 as f32);
        let css_w = w / dpr;

        // the text block: the lead line sized to the viewport, the others smaller beneath it,
        // each row centred; a breath between the lead and what follows
        let font_css = (css_w / 11.0).clamp(34.0, 76.0);
        let s_a = font_css * dpr / FONT;
        let rows = atlas.rows((css_w * 0.86).min(1100.0) * dpr, s_a);
        // the lead set close, the follow lines given air (script needs room for its loops), and a
        // pause of white between them
        let lead_h = font_css * 1.2 * dpr;
        let follow_h = font_css * FOLLOW * 1.75 * dpr;
        let breath = font_css * 0.3 * dpr;
        let mut ys = Vec::with_capacity(rows.len());
        let mut y = 0.0;
        for (i, &(_, _, k)) in rows.iter().enumerate() {
            let h = if k >= 1.0 { lead_h } else { follow_h };
            if i > 0 && k < 1.0 && rows[i - 1].2 >= 1.0 {
                y += breath;
            }
            ys.push(y + h * 0.5);
            y += h;
        }
        // a touch above the middle: the optical centre
        let mid = y * 0.5 + h * 0.03;
        let ys: Vec<f32> = ys.into_iter().map(|v| v - mid).collect();
        // where along the text block a point of the line sits, and its row's size; each row
        // centred on its ink
        let mids: Vec<f32> = rows.iter().map(|&(a, b, _)| atlas.ink_mid(a, b)).collect();
        let place = |at: f32| -> ([f32; 2], f32) {
            for (i, &(a, b, k)) in rows.iter().enumerate() {
                if at <= b || i + 1 == rows.len() {
                    let at = at.clamp(a, b);
                    return ([(at - mids[i]) * s_a * k, ys[i]], k);
                }
                // a break gap folds onto the start of the next row
                if at < rows[i + 1].0 {
                    let (na, _, nk) = rows[i + 1];
                    return ([(na - mids[i + 1]) * s_a * nk, ys[i + 1]], nk);
                }
            }
            unreachable!()
        };

        // the black hole sits where the plate's spiral starts (y down from the middle)
        let sink = -lift;

        // one strip along the sentence
        let mut us = Vec::new();
        let mut u = 0.0;
        while u < atlas.len {
            us.push(u);
            u += 2.0;
        }
        // exact row ends, so the page edge of every row is a vertex
        for &(a, b, _) in &rows {
            us.push(a);
            us.push(b);
        }
        us.push(atlas.len);
        us.sort_by(f32::total_cmp);
        us.dedup();
        let in_gap = |u: f32| rows.windows(2).any(|w| u > w[0].1 && u < w[1].0);
        let mut vertices = Vec::with_capacity(us.len() * 2);
        for u in us {
            let (pa, k) = place(u);
            let gap = if in_gap(u) { 1.0 } else { 0.0 };
            vertices.push(Vertex {
                u,
                side: -1.0,
                pa,
                gap,
                k,
            });
            vertices.push(Vertex {
                u,
                side: 1.0,
                pa,
                gap,
                k,
            });
        }

        let uniforms = Uniforms {
            res: [w, h],
            t: 0.0,
            s_a,
            yc: atlas.yc,
            atlas_h: atlas.height as f32,
            atlas_w: atlas.width as f32,
            head: 0.0,
            // the plate's stroke on bare paper (tone 0.06), so the handoff has no seam
            hair: 0.0976 * d,
            text_len: atlas.len,
            fall_t0: WRITE_AT + atlas.write_for + REST,
            sink,
            ink: [0.0; 4],
        };
        Self {
            size,
            uniforms,
            vertices,
        }
    }
}

struct Gpu {
    context: WgpuContextHandle,
    pipeline: wgpu::RenderPipeline,
    bind_group: wgpu::BindGroup,
    uniforms: wgpu::Buffer,
    vertices: Option<(wgpu::Buffer, u32)>,
}

/// Debug clock from the URL hash, for looking at a moment of the motion: `#t=5.2` freezes it
/// there (the greeting then never hands over), `#slow=4` stretches it.
enum Clock {
    Frozen(f32),
    Slow(f32),
}

impl Clock {
    fn from_hash() -> Self {
        use crate::route::debug::number;
        match (number("t"), number("slow")) {
            (Some(t), _) => Clock::Frozen(t),
            (None, f) => Clock::Slow(f.map_or(1.0, |f| f.max(0.05))),
        }
    }
}

pub struct Greeting {
    clock: Clock,
    atlas: Atlas,
    layout: Option<Layout>,
    gpu: Option<Gpu>,
    start: Instant,
}

impl Greeting {
    pub fn new() -> Self {
        Self {
            clock: Clock::from_hash(),
            atlas: Atlas::build(),
            layout: None,
            gpu: None,
            start: Instant::now(),
        }
    }

    /// Seconds into the greeting.
    fn t(&self) -> f32 {
        match self.clock {
            Clock::Frozen(t) => t,
            Clock::Slow(f) => self.start.elapsed().as_secs_f32() / f,
        }
    }

    /// The greeting is written and resting: a still moment for heavy work to go unnoticed.
    pub fn resting(&self) -> bool {
        self.t() > WRITE_AT + self.atlas.write_for + 0.1
    }

    /// The coil is closing on its point: the plate's line sets off out of it.
    pub fn drawing_out(&self) -> bool {
        self.after(DRAW_FROM)
    }

    /// The greeting has wound into its point and is gone.
    pub fn done(&self) -> bool {
        self.after(FALL)
    }

    /// More than `secs` into the fall (never, on a frozen clock).
    fn after(&self, secs: f32) -> bool {
        !matches!(self.clock, Clock::Frozen(_))
            && self.t() > WRITE_AT + self.atlas.write_for + REST + secs
    }

    fn ensure_gpu(&mut self, context: &WgpuContextHandle, format: wgpu::TextureFormat) {
        if self
            .gpu
            .as_ref()
            .is_some_and(|g| g.context.is_same_device(context))
        {
            return;
        }
        let device = context.device();
        let queue = context.queue();

        let shader = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("intro"),
            source: wgpu::ShaderSource::Wgsl(Cow::Borrowed(include_str!("intro.wgsl"))),
        });
        let uniforms = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("intro-uniforms"),
            size: std::mem::size_of::<Uniforms>() as u64,
            usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });

        let a = &self.atlas;
        let texture = device.create_texture(&wgpu::TextureDescriptor {
            label: Some("intro-atlas"),
            size: wgpu::Extent3d {
                width: a.width as u32,
                height: a.height as u32,
                depth_or_array_layers: 1,
            },
            mip_level_count: a.levels.len() as u32,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format: wgpu::TextureFormat::R8Unorm,
            usage: wgpu::TextureUsages::TEXTURE_BINDING | wgpu::TextureUsages::COPY_DST,
            view_formats: &[],
        });
        let (mut w, mut h) = (a.width as u32, a.height as u32);
        for (level, data) in a.levels.iter().enumerate() {
            queue.write_texture(
                wgpu::TexelCopyTextureInfo {
                    texture: &texture,
                    mip_level: level as u32,
                    origin: wgpu::Origin3d::ZERO,
                    aspect: wgpu::TextureAspect::All,
                },
                data,
                wgpu::TexelCopyBufferLayout {
                    offset: 0,
                    bytes_per_row: Some(w),
                    rows_per_image: Some(h),
                },
                wgpu::Extent3d {
                    width: w,
                    height: h,
                    depth_or_array_layers: 1,
                },
            );
            (w, h) = ((w / 2).max(1), (h / 2).max(1));
        }
        let view = texture.create_view(&Default::default());
        let sampler = device.create_sampler(&wgpu::SamplerDescriptor {
            label: Some("intro-sampler"),
            address_mode_u: wgpu::AddressMode::ClampToEdge,
            address_mode_v: wgpu::AddressMode::ClampToEdge,
            mag_filter: wgpu::FilterMode::Linear,
            min_filter: wgpu::FilterMode::Linear,
            mipmap_filter: wgpu::MipmapFilterMode::Linear,
            ..Default::default()
        });

        let layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("intro-layout"),
            entries: &[
                wgpu::BindGroupLayoutEntry {
                    binding: 0,
                    visibility: wgpu::ShaderStages::VERTEX_FRAGMENT,
                    ty: wgpu::BindingType::Buffer {
                        ty: wgpu::BufferBindingType::Uniform,
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 1,
                    visibility: wgpu::ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Texture {
                        sample_type: wgpu::TextureSampleType::Float { filterable: true },
                        view_dimension: wgpu::TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 2,
                    visibility: wgpu::ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Sampler(wgpu::SamplerBindingType::Filtering),
                    count: None,
                },
            ],
        });
        let bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: Some("intro-bind-group"),
            layout: &layout,
            entries: &[
                wgpu::BindGroupEntry {
                    binding: 0,
                    resource: uniforms.as_entire_binding(),
                },
                wgpu::BindGroupEntry {
                    binding: 1,
                    resource: wgpu::BindingResource::TextureView(&view),
                },
                wgpu::BindGroupEntry {
                    binding: 2,
                    resource: wgpu::BindingResource::Sampler(&sampler),
                },
            ],
        });
        let pipeline_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("intro-pipeline-layout"),
            bind_group_layouts: &[Some(&layout)],
            immediate_size: 0,
        });
        let pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("intro-pipeline"),
            layout: Some(&pipeline_layout),
            vertex: wgpu::VertexState {
                module: &shader,
                entry_point: Some("vs_main"),
                compilation_options: Default::default(),
                buffers: &[wgpu::VertexBufferLayout {
                    array_stride: std::mem::size_of::<Vertex>() as u64,
                    step_mode: wgpu::VertexStepMode::Vertex,
                    attributes: &wgpu::vertex_attr_array![0 => Float32, 1 => Float32, 2 => Float32x2, 3 => Float32, 4 => Float32],
                }],
            },
            fragment: Some(wgpu::FragmentState {
                module: &shader,
                entry_point: Some("fs_main"),
                compilation_options: Default::default(),
                // over the engraving's colour, adding to its ink amount (what the optics read)
                targets: &[Some(wgpu::ColorTargetState {
                    format,
                    blend: Some(wgpu::BlendState::ALPHA_BLENDING),
                    write_mask: wgpu::ColorWrites::ALL,
                })],
            }),
            primitive: wgpu::PrimitiveState { topology: wgpu::PrimitiveTopology::TriangleStrip, ..Default::default() },
            depth_stencil: None,
            multisample: Default::default(),
            multiview_mask: None,
            cache: None,
        });
        self.gpu = Some(Gpu {
            context: context.clone(),
            pipeline,
            bind_group,
            uniforms,
            vertices: None,
        });
        self.layout = None;
    }

    /// Ready the greeting for the plate's engraving pass: `format` and `size` are that pass's
    /// target at `dpr`, the spiral starts `lift` device px above the middle with its turns `d`
    /// apart, written in `ink`.
    pub fn prepare(
        &mut self,
        context: &WgpuContextHandle,
        format: wgpu::TextureFormat,
        size: gpui::Size<gpui::DevicePixels>,
        dpr: f32,
        lift: f32,
        d: f32,
        ink: [f32; 4],
    ) {
        self.ensure_gpu(context, format);
        let t = self.t();
        let Some(gpu) = self.gpu.as_mut() else { return };
        if self.layout.as_ref().is_none_or(|l| l.size != size) {
            let layout = Layout::new(&self.atlas, size, dpr, lift, d);
            let buffer = wgpu::util::DeviceExt::create_buffer_init(
                context.device(),
                &wgpu::util::BufferInitDescriptor {
                    label: Some("intro-ribbon"),
                    contents: bytemuck::cast_slice(&layout.vertices),
                    usage: wgpu::BufferUsages::VERTEX,
                },
            );
            gpu.vertices = Some((buffer, layout.vertices.len() as u32));
            self.layout = Some(layout);
        }
        let written = ((t - WRITE_AT) / self.atlas.write_for).clamp(0.0, 1.0);
        let head = if written >= 1.0 {
            self.atlas.len + 100.0
        } else {
            self.atlas.head(t - WRITE_AT) + 1.0
        };
        let u = &mut self.layout.as_mut().expect("laid out just above").uniforms;
        u.t = t;
        u.head = head;
        u.ink = ink;
        context
            .queue()
            .write_buffer(&gpu.uniforms, 0, bytemuck::bytes_of(u));
    }

    /// Draw the greeting into the plate's engraving pass (after `prepare` this frame).
    pub fn record(&self, pass: &mut wgpu::RenderPass<'_>) {
        let Some(gpu) = self.gpu.as_ref() else { return };
        let Some((buffer, count)) = gpu.vertices.as_ref() else {
            return;
        };
        pass.set_pipeline(&gpu.pipeline);
        pass.set_bind_group(0, &gpu.bind_group, &[]);
        pass.set_vertex_buffer(0, buffer.slice(..));
        pass.draw(0..*count, 0..1);
    }
}
