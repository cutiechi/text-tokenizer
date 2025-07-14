# text-tokenizer

A fast and simple Chinese text tokenizer written in Rust, powered by [jieba-rs](https://github.com/messense/jieba-rs). Supports both command-line and web API usage.

## Features

- Efficient Chinese word segmentation (using jieba)
- Filters out non-Chinese tokens
- Removes duplicate words and sorts by length
- Returns word list, count, and processing time
- Supports CLI and HTTP API modes

## Getting Started

### Prerequisites

- Rust (edition 2024 or later)
- Cargo

### Build

```bash
cargo build --release
```

## Usage

### Command Line

Tokenize a file and print the result as JSON:

```bash
cargo run --release -- tokenize --path <your_file.txt>
```

输出示例：

```json
{
  "words": ["分词", "中文", ...],
  "count": 10,
  "cost_ms": 2
}
```

### Web API

启动 HTTP 服务（默认监听 0.0.0.0:3000）：

```bash
cargo run --release -- serve
```

然后通过 POST 请求调用：

```
curl -X POST http://localhost:3000/api/tokenize \
  -H 'Content-Type: application/json' \
  -d '{"path": "your_file.txt"}'
```

返回 JSON 结构同上。

## Project Structure

- `src/main.rs`: CLI & Web server entry point
- `src/tokenizer.rs`: Tokenization logic

## Dependencies

- jieba-rs
- axum
- clap
- tokio
- serde
- anyhow

## License

This project is licensed under the MIT License.
