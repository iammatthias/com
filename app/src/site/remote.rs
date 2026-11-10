use gpui::Task;

pub enum Remote<T> {
    Loading(#[allow(dead_code)] Task<()>),
    Ready(T),
    GaveUp,
}

impl<T> Remote<T> {
    pub fn ready(&self) -> Option<&T> {
        match self {
            Remote::Ready(value) => Some(value),
            Remote::Loading(_) | Remote::GaveUp => None,
        }
    }
}
