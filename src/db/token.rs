use crate::db::{DATABASE_NAME, clickhouse::get_client};
use clickhouse::Row;
use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

const TABLE_NAME: &str = "token";

#[derive(Debug, Row, Serialize, Deserialize)]
pub struct Token {
    #[serde(with = "clickhouse::serde::uuid")]
    pub id: uuid::Uuid,
    pub name: String,
    #[serde(with = "clickhouse::serde::time::datetime64::nanos")]
    pub created_at: OffsetDateTime,
    #[serde(with = "clickhouse::serde::uuid")]
    pub file_id: uuid::Uuid,
    pub enabled: bool,
}

pub async fn save_all(token_names: Vec<String>, file_id: uuid::Uuid) -> Result<(), anyhow::Error> {
    let client = get_client().clone().with_database(DATABASE_NAME);
    let mut inserter = client.inserter(TABLE_NAME)?;
    let now = OffsetDateTime::now_utc();
    for token_name in token_names {
        inserter.write(&Token {
            id: uuid::Uuid::new_v4(),
            name: token_name,
            created_at: now,
            file_id,
            enabled: true,
        })?;
    }
    inserter.commit().await?;
    inserter.end().await?;
    Ok(())
}
