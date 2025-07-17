use clickhouse::Client;
use once_cell::sync::Lazy;

static CLIENT: Lazy<Client> = Lazy::new(|| {
    Client::default()
        .with_url("http://172.18.0.15:8123")
        .with_user("clickhouse")
        .with_password(".98Np6VddpwG8YHWpiEA")
        .with_option("async_insert", "1")
        .with_option("wait_for_async_insert", "0")
});

pub(crate) fn get_client() -> &'static Client {
    &CLIENT
}
