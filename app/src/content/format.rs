const MONTHS: [&str; 12] = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

pub fn fmt_date(iso: &str) -> String {
    let d = iso.get(..10).unwrap_or(iso);
    let mut parts = d.split('-');
    let (Some(y), Some(m), Some(day)) = (parts.next(), parts.next(), parts.next()) else {
        return d.to_string();
    };
    let (Ok(m), Ok(day)) = (m.parse::<usize>(), day.parse::<u32>()) else {
        return d.to_string();
    };
    match MONTHS.get(m.wrapping_sub(1)) {
        Some(name) => format!("{day} {name} {y}"),
        None => d.to_string(),
    }
}

pub fn fmt_date_short(iso: &str) -> String {
    let long = fmt_date(iso);
    let mut words: Vec<String> = long.split(' ').map(str::to_string).collect();
    if words.len() == 3 {
        words[1] = words[1].chars().take(3).collect();
    }
    words.join(" ")
}

pub fn encode_segment(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for b in s.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(b as char)
            }
            _ => out.push_str(&format!("%{b:02X}")),
        }
    }
    out
}

pub(super) fn clip(s: &str, n: usize) -> String {
    let s = s.trim();
    if s.chars().count() <= n {
        return s.to_string();
    }
    let cut: String = s.chars().take(n).collect();
    let cut = cut.rsplit_once(' ').map_or(cut.as_str(), |(a, _)| a);
    format!("{}…", cut.trim_end_matches([',', ';', ':', '.']))
}

pub fn page_href(base: &str, page: u32) -> String {
    if page <= 1 {
        base.to_string()
    } else {
        format!("{}/page/{page}", base.trim_end_matches('/'))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dates() {
        assert_eq!(fmt_date("2026-10-02T02:01:14Z"), "2 October 2026");
        assert_eq!(fmt_date_short("2024-03-09T16:43:00Z"), "9 Mar 2024");
        assert_eq!(fmt_date("soon"), "soon");
    }

    #[test]
    fn hrefs() {
        assert_eq!(page_href("/recipes", 1), "/recipes");
        assert_eq!(page_href("/recipes", 3), "/recipes/page/3");
        assert_eq!(encode_segment("apple intelligence"), "apple%20intelligence");
    }
}
