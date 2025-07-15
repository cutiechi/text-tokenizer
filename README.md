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

Example output:

```json
{
  "words": ["token1", "token2", ...],
  "count": 10,
  "cost_ms": 2
}
```

### Web API

Start the HTTP server (default: 0.0.0.0:3000):

```bash
cargo run --release -- serve
```

Then call the API via POST:

```
curl -X POST http://localhost:3000/api/tokenize \
  -H 'Content-Type: application/json' \
  -d '{"path": "your_file.txt"}'
```

The response is a JSON object as above.

## Docker

### Build multi-arch image (x86_64/amd64 and arm64)

You can build and run the Docker image locally:

```bash
docker build -t text-tokenizer:latest .
```

Or use GitHub Actions to build and push multi-arch images to GitHub Packages (ghcr.io). The workflow will tag images with:

- `latest`
- `sha-<commit>`
- `<project version>` (from Cargo.toml)

### Run with Docker

```bash
docker run --rm -p 3000:3000 text-tokenizer:latest serve
```

You can then access the API at `http://localhost:3000/api/tokenize`.

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
