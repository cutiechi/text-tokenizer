FROM rustlang/rust:nightly-bullseye AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
COPY . .
RUN cargo build --release
RUN strip /app/target/release/text-tokenizer || true

FROM gcr.io/distroless/cc-debian12
WORKDIR /app
COPY --from=builder /app/target/release/text-tokenizer /app/text-tokenizer
EXPOSE 3000
CMD ["/app/text-tokenizer", "serve"]
