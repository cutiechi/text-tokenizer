use jieba_rs::Jieba;
use once_cell::sync::Lazy;
use regex::Regex;
use serde::Serialize;
use std::collections::HashSet;
use std::time::Instant;

static JIEBA: Lazy<Jieba> = Lazy::new(|| Jieba::new());
static RE_ZH: Lazy<Regex> = Lazy::new(|| Regex::new(r"^[\u4e00-\u9fa5]+$").unwrap());

#[derive(Serialize)]
pub struct TokenizeResult {
    pub words: Vec<String>,
    pub count: usize,
    pub cost_ms: u128,
}

pub async fn tokenize(path: &str) -> Result<TokenizeResult, anyhow::Error> {
    let content = tokio::fs::read_to_string(path)
        .await
        .map_err(|e| anyhow::anyhow!("Failed to read file: {}", e))?;
    let start = Instant::now();
    let mut words: Vec<String> = JIEBA
        .cut(&content, true)
        .into_iter()
        .filter(|w| RE_ZH.is_match(w))
        .map(|w| w.to_string())
        .collect::<HashSet<_>>()
        .into_iter()
        .collect();
    words.sort_by_key(|w| w.len());
    let elapsed = start.elapsed();
    let count = words.len();
    Ok(TokenizeResult {
        words,
        count,
        cost_ms: elapsed.as_millis(),
    })
}
