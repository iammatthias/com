//! The plate on the GPU: its pipelines and textures, the uniforms packed each frame, and the
//! two passes (engrave, then optics) into the target GPUI paints.

use std::borrow::Cow;

use gpui::{Window, size};
use gpui_wgpu::{WgpuContextHandle, WgpuRenderTarget};
use web_time::Instant;

use super::atlas::{HAIR, PAD, TitleAtlas, pen_offset};
use super::geom::{PORTRAIT, PORTRAIT_SIDE};
use super::{CONTROLS, PANES, Plate};
use crate::theme::Theme;

/// the engraving between passes: colour plus ink amount, filterable everywhere including WebGL2
const ENGRAVED_FORMAT: wgpu::TextureFormat = wgpu::TextureFormat::Rgba8Unorm;

/// most device pixels the plate shades per frame (two full-screen passes)
const PIXEL_BUDGET: f32 = 2.4e6;

/// the pen's arc when there's no pen, past any turn on screen: the shader draws the whole line
/// (card.js sends the same)
const WHOLE_LINE: f32 = 1e12;

#[repr(C)]
#[derive(Clone, Copy, Default, bytemuck::Pod, bytemuck::Zeroable)]
pub(super) struct Uniforms {
    rtd: [f32; 4],
    line: [f32; 4],
    script: [f32; 4],
    sheet: [f32; 4],
    rows: [f32; 4],
    view: [f32; 4],
    wph: [f32; 4],
    wfq: [f32; 4],
    mph: [f32; 4],
    optics: [f32; 4],
    clocks: [f32; 4],
    ab_ph: [f32; 4],
    pen: [f32; 4],
    frame: [f32; 4],
    fl0: [f32; 4],
    fl1: [f32; 4],
    fl2: [f32; 4],
    ink: [f32; 4],
    paper: [f32; 4],
    accent: [f32; 4],
    panes: [[f32; 4]; PANES],
    /// the panes' corner radius (device px), the spiral's lift (device px, y up), the pen's arc, _
    glass: [f32; 4],
    stops: [[f32; 4]; 5],
}

pub(super) struct Gpu {
    context: WgpuContextHandle,
    pipeline: wgpu::RenderPipeline,
    optics: wgpu::RenderPipeline,
    layout: wgpu::BindGroupLayout,
    engraved_layout: wgpu::BindGroupLayout,
    /// the engraving pass's target and the optics pass's view of it
    engraved: Option<(
        gpui::Size<gpui::DevicePixels>,
        wgpu::TextureView,
        wgpu::BindGroup,
    )>,
    sampler: wgpu::Sampler,
    uniforms: wgpu::Buffer,
    portrait: wgpu::TextureView,
    bind_group: Option<wgpu::BindGroup>,
}

impl Plate {
    fn ensure_gpu(&mut self, context: &WgpuContextHandle) {
        if self
            .gpu
            .as_ref()
            .is_some_and(|g| g.context.is_same_device(context))
        {
            return;
        }
        let device = context.device();
        let shader = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("plate"),
            source: wgpu::ShaderSource::Wgsl(Cow::Borrowed(include_str!("../plate.wgsl"))),
        });
        let uniforms = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("plate-uniforms"),
            size: std::mem::size_of::<Uniforms>() as u64,
            usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });
        let texture_entry = |binding| wgpu::BindGroupLayoutEntry {
            binding,
            visibility: wgpu::ShaderStages::FRAGMENT,
            ty: wgpu::BindingType::Texture {
                sample_type: wgpu::TextureSampleType::Float { filterable: true },
                view_dimension: wgpu::TextureViewDimension::D2,
                multisampled: false,
            },
            count: None,
        };
        let layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("plate-layout"),
            entries: &[
                wgpu::BindGroupLayoutEntry {
                    binding: 0,
                    visibility: wgpu::ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Buffer {
                        ty: wgpu::BufferBindingType::Uniform,
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
                texture_entry(1),
                wgpu::BindGroupLayoutEntry {
                    binding: 2,
                    visibility: wgpu::ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Sampler(wgpu::SamplerBindingType::Filtering),
                    count: None,
                },
                texture_entry(3),
                texture_entry(4),
            ],
        });
        let sampler = device.create_sampler(&wgpu::SamplerDescriptor {
            label: Some("plate-sampler"),
            address_mode_u: wgpu::AddressMode::ClampToEdge,
            address_mode_v: wgpu::AddressMode::ClampToEdge,
            mag_filter: wgpu::FilterMode::Linear,
            min_filter: wgpu::FilterMode::Linear,
            mipmap_filter: wgpu::MipmapFilterMode::Linear,
            anisotropy_clamp: 8,
            ..Default::default()
        });
        let engraved_layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("plate-engraved-layout"),
            entries: &[texture_entry(0)],
        });
        let pass = |label: &str,
                    entry: &str,
                    layouts: &[Option<&wgpu::BindGroupLayout>],
                    format: wgpu::TextureFormat| {
            let pipeline_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
                label: Some(label),
                bind_group_layouts: layouts,
                immediate_size: 0,
            });
            device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
                label: Some(label),
                layout: Some(&pipeline_layout),
                vertex: wgpu::VertexState {
                    module: &shader,
                    entry_point: Some("vs_main"),
                    compilation_options: Default::default(),
                    buffers: &[],
                },
                fragment: Some(wgpu::FragmentState {
                    module: &shader,
                    entry_point: Some(entry),
                    compilation_options: Default::default(),
                    targets: &[Some(wgpu::ColorTargetState {
                        format,
                        blend: None,
                        write_mask: wgpu::ColorWrites::ALL,
                    })],
                }),
                primitive: Default::default(),
                depth_stencil: None,
                multisample: Default::default(),
                multiview_mask: None,
                cache: None,
            })
        };
        let pipeline = pass(
            "plate-engrave",
            "fs_plate",
            &[Some(&layout)],
            ENGRAVED_FORMAT,
        );
        let optics = pass(
            "plate-optics",
            "fs_optics",
            &[Some(&layout), Some(&engraved_layout)],
            context.texture_format(),
        );
        self.last_drawn = None;
        let portrait = device.create_texture(&wgpu::TextureDescriptor {
            label: Some("plate-portrait"),
            size: wgpu::Extent3d {
                width: PORTRAIT_SIDE,
                height: PORTRAIT_SIDE,
                depth_or_array_layers: 1,
            },
            mip_level_count: 1,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format: wgpu::TextureFormat::R8Unorm,
            usage: wgpu::TextureUsages::TEXTURE_BINDING | wgpu::TextureUsages::COPY_DST,
            view_formats: &[],
        });
        context.queue().write_texture(
            wgpu::TexelCopyTextureInfo {
                texture: &portrait,
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            PORTRAIT,
            wgpu::TexelCopyBufferLayout {
                offset: 0,
                bytes_per_row: Some(PORTRAIT_SIDE),
                rows_per_image: Some(PORTRAIT_SIDE),
            },
            wgpu::Extent3d {
                width: PORTRAIT_SIDE,
                height: PORTRAIT_SIDE,
                depth_or_array_layers: 1,
            },
        );
        let portrait = portrait.create_view(&Default::default());
        self.gpu = Some(Gpu {
            context: context.clone(),
            pipeline,
            optics,
            layout,
            engraved_layout,
            engraved: None,
            sampler,
            uniforms,
            portrait,
            bind_group: None,
        });
        self.target = None;
        self.atlas_dirty = true;
    }

    fn upload_atlas(&mut self) {
        if self.atlas.levels.is_empty() {
            self.atlas = TitleAtlas::build(&self.titles);
        }
        let Some(gpu) = self.gpu.as_mut() else { return };
        let device = gpu.context.device();
        let queue = gpu.context.queue();
        let a = &self.atlas;
        let atlas = device.create_texture(&wgpu::TextureDescriptor {
            label: Some("plate-atlas"),
            size: wgpu::Extent3d {
                width: a.width,
                height: a.height,
                depth_or_array_layers: 1,
            },
            mip_level_count: a.levels.len() as u32,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format: wgpu::TextureFormat::Rg8Unorm,
            usage: wgpu::TextureUsages::TEXTURE_BINDING | wgpu::TextureUsages::COPY_DST,
            view_formats: &[],
        });
        let (mut w, mut h) = (a.width, a.height);
        for (level, data) in a.levels.iter().enumerate() {
            queue.write_texture(
                wgpu::TexelCopyTextureInfo {
                    texture: &atlas,
                    mip_level: level as u32,
                    origin: wgpu::Origin3d::ZERO,
                    aspect: wgpu::TextureAspect::All,
                },
                data,
                wgpu::TexelCopyBufferLayout {
                    offset: 0,
                    bytes_per_row: Some(w * 2),
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
        let segs = device.create_texture(&wgpu::TextureDescriptor {
            label: Some("plate-segments"),
            size: wgpu::Extent3d {
                width: a.segs_w,
                height: a.segs_h,
                depth_or_array_layers: 1,
            },
            mip_level_count: 1,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format: wgpu::TextureFormat::Rgba8Unorm,
            usage: wgpu::TextureUsages::TEXTURE_BINDING | wgpu::TextureUsages::COPY_DST,
            view_formats: &[],
        });
        queue.write_texture(
            wgpu::TexelCopyTextureInfo {
                texture: &segs,
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            &a.seg_table,
            wgpu::TexelCopyBufferLayout {
                offset: 0,
                bytes_per_row: Some(a.segs_w * 4),
                rows_per_image: Some(a.segs_h),
            },
            wgpu::Extent3d {
                width: a.segs_w,
                height: a.segs_h,
                depth_or_array_layers: 1,
            },
        );
        let atlas_view = atlas.create_view(&Default::default());
        let segs_view = segs.create_view(&Default::default());
        gpu.bind_group = Some(device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: Some("plate-bind-group"),
            layout: &gpu.layout,
            entries: &[
                wgpu::BindGroupEntry {
                    binding: 0,
                    resource: gpu.uniforms.as_entire_binding(),
                },
                wgpu::BindGroupEntry {
                    binding: 1,
                    resource: wgpu::BindingResource::TextureView(&atlas_view),
                },
                wgpu::BindGroupEntry {
                    binding: 2,
                    resource: wgpu::BindingResource::Sampler(&gpu.sampler),
                },
                wgpu::BindGroupEntry {
                    binding: 3,
                    resource: wgpu::BindingResource::TextureView(&segs_view),
                },
                wgpu::BindGroupEntry {
                    binding: 4,
                    resource: wgpu::BindingResource::TextureView(&gpu.portrait),
                },
            ],
        }));
        self.atlas_dirty = false;
        crate::mark("atlas uploaded");
        self.last_drawn = None;
        // the GPU has its own copy now; the CPU one is rebuilt only if the device is ever lost
        self.atlas.levels = Vec::new();
        self.atlas.seg_table = Vec::new();
    }

    pub(super) fn draw(&mut self, window: &mut Window, theme: &Theme) {
        let now = Instant::now();
        if self.reveal.first_draw(now) {
            crate::mark("plate first draw");
            self.last = now;
        }
        let Some(context) = WgpuContextHandle::from_window(window) else {
            return;
        };
        if context.device_lost() {
            self.gpu = None;
            self.target = None;
            return;
        }
        self.ensure_gpu(&context);
        if self.atlas_dirty {
            self.upload_atlas();
        }
        // render scale: device pixels up to a budget, so a large retina window stays interactive;
        // the surface is scaled up to the window by GPUI
        let viewport = window.viewport_size();
        let css_px = f32::from(viewport.width) * f32::from(viewport.height);
        // phones get a smaller budget: their GPUs are slower and their pixels denser
        let pixel_budget = if f32::from(viewport.width) < crate::design::PHONE_W {
            PIXEL_BUDGET * 0.35
        } else {
            PIXEL_BUDGET
        };
        let budget = (pixel_budget / css_px.max(1.0)).sqrt();
        let dpr = window.scale_factor().min(budget).max(0.75) * if self.half { 0.5 } else { 1.0 };
        let tsize = size(
            gpui::DevicePixels(((f32::from(viewport.width) * dpr).round() as i32).max(1)),
            gpui::DevicePixels(((f32::from(viewport.height) * dpr).round() as i32).max(1)),
        );
        (self.dpr, self.w, self.h, self.dark) =
            (dpr, tsize.width.0 as f32, tsize.height.0 as f32, theme.dark);
        if self.target.as_ref().is_none_or(|t| t.size() != tsize) {
            self.target = Some(WgpuRenderTarget::new(&context, tsize));
        }
        self.tick();
        self.frame
            .follow(self.w / self.dpr.max(0.01) < crate::design::PHONE_W);

        let a = &self.atlas;
        let z = &self.deal;
        let hover = self
            .hover
            .map(|i| (a.segs[i].x0 + a.segs[i].x1) / 2.0)
            .unwrap_or(-9.0);
        let u = Uniforms {
            rtd: [self.w, self.h, self.t, self.spacing() * dpr],
            line: [CONTROLS.bias, self.e_warp, self.e_disp, a.font_ref],
            script: [CONTROLS.em, a.row_c, HAIR, a.text_len],
            sheet: [a.width as f32, a.height as f32, a.row_w, a.stride],
            rows: [PAD, a.row_h, self.view.z, self.text_start()],
            view: [self.view.x, self.view.y, hover, hover],
            wph: z.wph,
            wfq: z.wfq,
            mph: [z.mph[0], z.mph[1], z.mph[2], 0.0],
            optics: if self.lite {
                [1.0, 0.0, 0.0, 0.0]
            } else {
                [1.0, CONTROLS.flare, CONTROLS.haze, CONTROLS.ab]
            },
            clocks: [dpr, z.ab_freq, self.c * 0.4, self.reveal.progress()],
            ab_ph: z.ab_ph,
            pen: [
                z.ab_dir[0],
                z.ab_dir[1],
                self.frame_progress(),
                pen_offset(self.pen_weight()),
            ],
            frame: self.core(),
            fl0: self.flare_uniform(0),
            fl1: self.flare_uniform(1),
            fl2: self.flare_uniform(2),
            ink: Theme::uniform(theme.ink),
            paper: Theme::uniform(theme.paper),
            accent: Theme::uniform(theme.accent),
            panes: self.pane_uniforms(),
            glass: [
                crate::design::CONTROL_RADIUS * dpr,
                self.lift(),
                self.pen_arc().unwrap_or(WHOLE_LINE),
                // the optics from the first frame for a visitor greeted on the plate; else they
                // rise with it
                if self.greeted { 1.0 } else { 0.0 },
            ],
            stops: theme.stops.map(Theme::uniform),
        };
        // nothing moved since the last frame (a settled page frame, a still plate): keep the last image
        let unchanged = self.greeting.is_none()
            && self.last_drawn.as_ref().is_some_and(|(last, size)| {
                *size == tsize && bytemuck::bytes_of(last) == bytemuck::bytes_of(&u)
            });
        if unchanged {
            return;
        }
        self.last_drawn = Some((u, tsize));
        let Some(gpu) = self.gpu.as_mut() else { return };
        if gpu.engraved.as_ref().is_none_or(|(s, ..)| *s != tsize) {
            let device = context.device();
            let texture = device.create_texture(&wgpu::TextureDescriptor {
                label: Some("plate-engraved"),
                size: wgpu::Extent3d {
                    width: tsize.width.0 as u32,
                    height: tsize.height.0 as u32,
                    depth_or_array_layers: 1,
                },
                mip_level_count: 1,
                sample_count: 1,
                dimension: wgpu::TextureDimension::D2,
                format: ENGRAVED_FORMAT,
                usage: wgpu::TextureUsages::RENDER_ATTACHMENT
                    | wgpu::TextureUsages::TEXTURE_BINDING,
                view_formats: &[],
            });
            let view = texture.create_view(&Default::default());
            let group = device.create_bind_group(&wgpu::BindGroupDescriptor {
                label: Some("plate-engraved-group"),
                layout: &gpu.engraved_layout,
                entries: &[wgpu::BindGroupEntry {
                    binding: 0,
                    resource: wgpu::BindingResource::TextureView(&view),
                }],
            });
            gpu.engraved = Some((tsize, view, group));
        }
        let (lift, d, em) = (self.lift(), self.spacing() * dpr, self.script_em() * dpr);
        if let Some(greeting) = self.greeting.as_mut() {
            greeting.prepare(&context, ENGRAVED_FORMAT, tsize, dpr, lift, d, em, u.ink);
        }
        let gpu = self.gpu.as_ref().expect("checked at the top of draw");
        let Some(bind_group) = gpu.bind_group.as_ref() else {
            return;
        };
        let (_, engraved_view, engraved_group) =
            gpu.engraved.as_ref().expect("made at this size just above");
        let target = self.target.as_ref().expect("sized at the top of draw");
        context
            .queue()
            .write_buffer(&gpu.uniforms, 0, bytemuck::bytes_of(&u));
        let mut encoder = context.device().create_command_encoder(&Default::default());
        for (label, view, pipeline, second) in [
            ("plate-engrave", engraved_view, &gpu.pipeline, None),
            (
                "plate-optics",
                target.view(),
                &gpu.optics,
                Some(engraved_group),
            ),
        ] {
            let mut pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                label: Some(label),
                color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                    view,
                    resolve_target: None,
                    ops: wgpu::Operations {
                        load: wgpu::LoadOp::Clear(wgpu::Color::BLACK),
                        store: wgpu::StoreOp::Store,
                    },
                    depth_slice: None,
                })],
                depth_stencil_attachment: None,
                ..Default::default()
            });
            pass.set_pipeline(pipeline);
            pass.set_bind_group(0, bind_group, &[]);
            if let Some(group) = second {
                pass.set_bind_group(1, group, &[]);
            }
            pass.draw(0..3, 0..1);
            // the greeting is written into the engraving, so the optics fall on it too
            if second.is_none()
                && let Some(greeting) = self.greeting.as_ref()
            {
                greeting.record(&mut pass);
            }
        }
        context.queue().submit([encoder.finish()]);
    }
}
