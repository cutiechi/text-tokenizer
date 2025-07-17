use crate::db::{DATABASE_NAME, clickhouse::get_client};
use clickhouse::{Row, sql::Identifier};
use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

const TABLE_NAME: &str = "file";

#[derive(Debug, Row, Serialize, Deserialize, Clone)]
pub struct File {
    #[serde(with = "clickhouse::serde::uuid")]
    pub id: uuid::Uuid,
    pub name: String,
    #[serde(with = "clickhouse::serde::time::datetime64::nanos")]
    pub created_at: OffsetDateTime,
}

pub async fn get_by_name(name: &str) -> Result<Option<File>, anyhow::Error> {
    let client = get_client().clone().with_database(DATABASE_NAME);
    let file = client
        .query("SELECT ?fields FROM ? WHERE name = ?")
        .bind(Identifier(TABLE_NAME))
        .bind(name)
        .fetch_optional::<File>()
        .await?;
    Ok(file)
}

pub async fn create(name: &str) -> Result<File, anyhow::Error> {
    let client = get_client().clone().with_database(DATABASE_NAME);
    if get_by_name(name).await?.is_some() {
        return Err(anyhow::anyhow!("File already exists"));
    }
    let mut inserter = client.inserter(TABLE_NAME)?;
    let file = File {
        id: uuid::Uuid::new_v4(),
        name: name.to_string(),
        created_at: OffsetDateTime::now_utc(),
    };
    inserter.write(&file)?;
    inserter.commit().await?;
    inserter.end().await?;
    Ok(file)
}
