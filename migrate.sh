#!/usr/bin/env bash
set -eo pipefail

DB="./gamedata/gamedata.db"
defaultGearsJSON='{"monitor": null, "gpu": null, "mouse": null, "keyboard": null}'

echo "[DB] Migration start: $DB"

# Ensure gamedata folder exists
mkdir -p "$(dirname "$DB")"

# Initial table creation (safe if already exists)
sqlite3 "$DB" <<SQL
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    balance INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_characters (
    user_id TEXT,
    character_id TEXT,
    level INTEGER DEFAULT 1,
    xp_now INTEGER DEFAULT 0,
    xp_max INTEGER DEFAULT 100,
    PRIMARY KEY (user_id, character_id)
);

CREATE TABLE IF NOT EXISTS user_items (
    user_id TEXT,
    item_id TEXT,
    count INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS gears (
    id TEXT PRIMARY KEY,
    label TEXT,
    image TEXT,
    tier INTEGER DEFAULT 0,
    growth_rate REAL DEFAULT 0,
    mood_down_rate REAL DEFAULT 0,
    supa_rate REAL DEFAULT 0,
    stamina_cost_per_hour INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS channels (
    user_id TEXT,
    channel_name TEXT,
    profile_picture TEXT,
    banner_picture TEXT,
    mood INTEGER DEFAULT 0,
    color TEXT,
    character_id TEXT,
    sub_count INTEGER DEFAULT 0,
    growth_rate REAL DEFAULT 0,
    mood_down_rate REAL DEFAULT 0,
    supa_rate REAL DEFAULT 0,
    stamina_current INTEGER DEFAULT 0,
    stamina_max INTEGER DEFAULT 0,
    stamina_cost_per_hour INTEGER DEFAULT 0,
    gears TEXT DEFAULT '${defaultGearsJSON}',
    PRIMARY KEY (user_id, channel_name)
);

CREATE TABLE IF NOT EXISTS characters (
    value TEXT PRIMARY KEY,
    label TEXT,
    series TEXT,
    rarity TEXT,
    image TEXT,
    edition TEXT
);

CREATE TABLE IF NOT EXISTS data (
    key TEXT PRIMARY KEY,
    value TEXT
);
SQL

echo "[DB] Tables ensured."

# Helper: check column
column_exists() {
  sqlite3 "$DB" "PRAGMA table_info($1);" | awk -F'|' '{print $2}' | grep -x -F "$2" >/dev/null 2>&1
}

# Helper: add column
check_and_add() {
  if ! column_exists "$1" "$2"; then
    echo "[DB] Adding column '$2' to '$1'"
    sqlite3 "$DB" "ALTER TABLE $1 ADD COLUMN $3;"
  fi
}

# Helper: remove columns NOT in allowed list
remove_excess_columns() {
  local table=$1
  shift
  local desired=("$@")
  local current=($(sqlite3 "$DB" "PRAGMA table_info($table);" | awk -F'|' '{print $2}'))

  local excess=()
  for col in "${current[@]}"; do
    if [[ ! " ${desired[*]} " =~ " $col " ]]; then
      excess+=("$col")
    fi
  done

  if [ ${#excess[@]} -eq 0 ]; then
    echo "[DB] No excess columns in '$table'"
    return
  fi

  echo "[DB] Removing excess columns in '$table': ${excess[*]}"

  local copy_cols=$(printf "%s, " "${desired[@]}")
  copy_cols=${copy_cols%, }

  sqlite3 "$DB" <<SQL
BEGIN TRANSACTION;
CREATE TABLE ${table}_new AS SELECT $copy_cols FROM $table;
DROP TABLE $table;
ALTER TABLE ${table}_new RENAME TO $table;
COMMIT;
SQL
}

# === Apply schema ===

apply_table_schema() {
  local table=$1
  shift
  local cols=("$@")

  for col_def in "${cols[@]}"; do
    IFS=: read -r col def <<< "$col_def"
    check_and_add "$table" "$col" "$def"
  done

  # Extract just column names for cleanup
  local col_names=()
  for col_def in "${cols[@]}"; do
    IFS=: read -r col _ <<< "$col_def"
    col_names+=("$col")
  done

  remove_excess_columns "$table" "${col_names[@]}"
}

# Define schemas
apply_table_schema "users" \
  "id:id TEXT" \
  "balance:balance INTEGER DEFAULT 0"

apply_table_schema "user_characters" \
  "user_id:user_id TEXT" \
  "character_id:character_id TEXT" \
  "level:level INTEGER DEFAULT 1" \
  "xp_now:xp_now INTEGER DEFAULT 0" \
  "xp_max:xp_max INTEGER DEFAULT 100"

apply_table_schema "user_items" \
  "user_id:user_id TEXT" \
  "item_id:item_id TEXT" \
  "count:count INTEGER DEFAULT 0"

apply_table_schema "gears" \
  "id:id TEXT" \
  "label:label TEXT" \
  "image:image TEXT" \
  "tier:tier INTEGER DEFAULT 0"\
  "growth_rate:growth_rate REAL DEFAULT 0"\
  "mood_down_rate:mood_down_rate REAL DEFAULT 0"\
  "supa_rate:supa_rate REAL DEFAULT 0"\
  "stamina_cost_per_hour:stamina_cost_per_hour INTEGER DEFAULT 0"

apply_table_schema "channels" \
  "user_id:user_id TEXT" \
  "channel_name:channel_name TEXT" \
  "profile_picture:profile_picture TEXT" \
  "banner_picture:banner_picture TEXT" \
  "mood:mood INTEGER DEFAULT 0" \
  "color:color TEXT" \
  "character_id:character_id TEXT" \
  "sub_count:sub_count INTEGER DEFAULT 0" \
  "growth_rate:growth_rate REAL DEFAULT 0" \
  "mood_down_rate:mood_down_rate REAL DEFAULT 0" \
  "supa_rate:supa_rate REAL DEFAULT 0" \
  "stamina_current:stamina_current INTEGER DEFAULT 0" \
  "stamina_max:stamina_max INTEGER DEFAULT 0" \
  "stamina_cost_per_hour:stamina_cost_per_hour INTEGER DEFAULT 0" \
  "gears:gears TEXT DEFAULT '${defaultGearsJSON}'"

apply_table_schema "characters" \
  "value:value TEXT" \
  "label:label TEXT" \
  "series:series TEXT" \
  "rarity:rarity TEXT" \
  "image:image TEXT" \
  "edition:edition TEXT"

apply_table_schema "data" \
  "key:key TEXT" \
  "value:value TEXT"

echo "[DB] Migration complete."
