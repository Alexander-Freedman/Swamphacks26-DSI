// Every number the UI shows can carry where it came from.
export type Provenance = {
  source: string // e.g. "NWS alert", "Nessie transfer"
  id?: string // upstream record id
  url?: string
  at?: string // ISO time the value was observed
}

export type Sourced<T> = { value: T; prov: Provenance }
