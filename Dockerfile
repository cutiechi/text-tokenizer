FROM rustlang/rust:nightly-alpine AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/text-tokenizer /app/text-tokenizer
COPY --from=builder /app/Cargo.toml /app/Cargo.toml
COPY --from=builder /app/Cargo.lock /app/Cargo.lock
COPY --from=builder /app/src /app/src
EXPOSE 3000
CMD ["/app/text-tokenizer", "serve"]