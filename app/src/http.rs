//! The Worker's files and JSON, fetched and decoded the one way every caller wants them, and
//! tried again as patiently as each caller can wait.

use std::sync::Arc;
use std::time::Duration;

use gpui::BackgroundExecutor;
use gpui::http_client::HttpClient;
use serde::de::DeserializeOwned;

use crate::route;

/// How a failed fetch is tried again: after the nth failure, a wait of `first` doubled n-1
/// times (at most `cap`), until `tries` have failed.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Retry {
    pub tries: u32,
    pub first: Duration,
    pub cap: Duration,
}

impl Retry {
    /// one try: what fails is the caller's to handle (a prefetch, the feed's own "Try again")
    pub const ONCE: Retry = Retry {
        tries: 1,
        first: Duration::ZERO,
        cap: Duration::ZERO,
    };
    /// a face, or the page a reader asked for: a dropped request or two, then say so
    pub const BRIEF: Retry = Retry {
        tries: 3,
        first: Duration::from_millis(400),
        cap: Duration::from_secs(2),
    };
    /// what letters the spiral (the index, the timeline): no one is waiting on it, so keep at it
    pub const PATIENT: Retry = Retry {
        tries: 8,
        first: Duration::from_millis(800),
        cap: Duration::from_secs(15),
    };

    /// The wait after `failures` failed tries, or None once they're spent.
    pub fn wait(&self, failures: u32) -> Option<Duration> {
        (failures < self.tries).then(|| {
            self.first
                .saturating_mul(1 << failures.saturating_sub(1).min(16))
                .min(self.cap)
        })
    }
}

/// GET `url`'s body, tried again per `retry` when the network or the server fails (a 4xx is
/// the request's own fault: final, but for a timeout or a rate limit).
pub async fn get_bytes(
    client: Arc<dyn HttpClient>,
    url: String,
    retry: Retry,
    timer: BackgroundExecutor,
) -> anyhow::Result<Vec<u8>> {
    let mut failures = 0;
    loop {
        let err = match client.get(&url, true).await {
            Ok(res) if res.status.is_success() => return Ok(res.body),
            Ok(res)
                if res.status.is_client_error() && !matches!(res.status.as_u16(), 408 | 429) =>
            {
                anyhow::bail!("{} for {url}", res.status)
            }
            Ok(res) => anyhow::anyhow!("{} for {url}", res.status),
            Err(e) => e,
        };
        failures += 1;
        match retry.wait(failures) {
            Some(wait) => timer.timer(wait).await,
            None => return Err(err),
        }
    }
}

/// GET `url` and decode its JSON, tried again per `retry`.
pub async fn get_json<T: DeserializeOwned>(
    client: Arc<dyn HttpClient>,
    url: String,
    retry: Retry,
    timer: BackgroundExecutor,
) -> anyhow::Result<T> {
    Ok(serde_json::from_slice::<T>(
        &get_bytes(client, url, retry, timer).await?,
    )?)
}

/// Where the Worker answers for a site path.
pub fn route_url(path: &str) -> String {
    format!("{}/api/app/route?path={}", route::origin(), encode(path))
}

/// Percent-encode a path for use as a query value: each segment as a tag's, the `/`s kept.
fn encode(path: &str) -> String {
    path.split('/')
        .map(crate::content::encode_segment)
        .collect::<Vec<_>>()
        .join("/")
}

#[cfg(test)]
mod tests {
    use super::{Retry, encode};
    use std::time::Duration;

    #[test]
    fn waits_longer_each_time_until_the_tries_are_spent() {
        let ms = |r: Retry| {
            (1..=r.tries)
                .map(|n| r.wait(n).map(|d| d.as_millis() as u64))
                .collect::<Vec<_>>()
        };
        assert_eq!(ms(Retry::ONCE), vec![None]);
        assert_eq!(ms(Retry::BRIEF), vec![Some(400), Some(800), None]);
        assert_eq!(
            ms(Retry::PATIENT),
            vec![
                Some(800),
                Some(1600),
                Some(3200),
                Some(6400),
                Some(12800),
                Some(15000),
                Some(15000),
                None
            ]
        );
        assert_eq!(Retry::PATIENT.wait(40), None);
        assert_eq!(
            Retry {
                tries: 99,
                first: Duration::from_secs(1),
                cap: Duration::MAX
            }
            .wait(60),
            Some(Duration::from_secs(1 << 16))
        );
    }

    #[test]
    fn encodes_a_path_as_a_query_value() {
        assert_eq!(
            encode("/tags/apple intelligence"),
            "/tags/apple%20intelligence"
        );
        assert_eq!(
            encode("/posts/café?x=1&y#z"),
            "/posts/caf%C3%A9%3Fx%3D1%26y%23z"
        );
        assert_eq!(encode("//a/~b_c.d-e/"), "//a/~b_c.d-e/");
        assert_eq!(encode(""), "");
    }
}
