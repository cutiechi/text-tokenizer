mod tokenizer;
use anyhow::Result;
use axum::{Json, Router, http::StatusCode, routing::post};
use clap::{Parser, Subcommand};
use serde::Deserialize;
use tokenizer::TokenizeResult;

#[derive(Parser)]
#[command(author, version, about)]
struct Cli {
    #[command(subcommand)]
    command: Option<Command>,
}

#[derive(Subcommand)]
enum Command {
    Tokenize {
        #[arg(short, long)]
        path: String,
    },
    Serve,
}

#[derive(Deserialize)]
struct TokenizerPayload {
    path: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();
    let cli = Cli::parse();

    match cli.command {
        Some(Command::Tokenize { path }) => {
            let result = tokenizer::tokenize(&path).await?;
            println!("{}", serde_json::to_string_pretty(&result)?);
        }
        _ => {
            let app = Router::new().route("/api/tokenize", post(tokenize));
            let addr = "0.0.0.0:3000";
            let listener = tokio::net::TcpListener::bind(addr).await?;
            axum::serve(listener, app).await?;
        }
    }
    Ok(())
}

async fn tokenize(
    Json(payload): Json<TokenizerPayload>,
) -> Result<Json<TokenizeResult>, (StatusCode, String)> {
    let result = tokenizer::tokenize(&payload.path).await.map_err(|e| {
        (
            StatusCode::BAD_REQUEST,
            format!("Failed to tokenize file: {}", e),
        )
    })?;

    Ok(Json(result))
}
