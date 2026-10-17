# Gemini API for the engine (#31)

Free-tier limits are from the AI Studio rate-limit page for our project (Fri Oct 16 10:15 PM) and override anything else. Paid prices were rechecked on [ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing) (3.5 Flash-Lite $0.30 in / $2.50 out; 3.1 Flash-Lite $0.25 / $1.50 per 1M). Latency below is an estimate until we time it on our key.

**Bottom line:**
- **Live:** `gemini-3.5-flash-lite` at `thinking_level=minimal`, one streamed structured call per fresh topic, then cached.
- **Overflow:** `gemini-3.1-flash-lite` → `gemma-4-26b` → a "try a showcase topic" screen.
- **Blind check:** `gemma-4-31b-it`.
- **Flash (20/day):** only for offline showcase drafting.
- **Daily 429s:** never retried. A counter switches models at 480/day.
- **If billing were ever on:** ~$5 for 500 sessions. Not assumed.

# Gemini for Mental Models: models, limits, structured output, latency, demo safety

Checked Fri Oct 16 2026. Sources, in order of trust:
1. Our own AI Studio rate-limit page (cited as **"AI Studio rate-limit page, our project"**, read Fri Oct 16, 10:15 PM).
2. Official ai.google.dev docs.
3. The `google-genai` 2.31.0 wheel source (`google/genai/types.py`), read directly.
4. Third-party write-ups, labeled as such.

Builds on docs/research/any-topic-engine.md, docs/sponsor-tech.md and docs/feasibility.md. Where those conflict with this, this wins on Gemini limits; the 250 vs 1,500 RPD numbers in sponsor-tech.md are stale.

## TL;DR: design for the free tier

- **Our free-tier limits (AI Studio rate-limit page, our project):**

  | Model group | RPM | TPM | Per day |
  |---|---|---|---|
  | Flash (3.8, 3.7, 3.6, 3, 2.5 Flash) | 5 | 250K | **20** |
  | Flash-Lite (3.5, 3.1) | 15 | 250K | **500** |
  | Gemma 4 31B / 26B | 30 | **16K** | 14.4K |
  | Embeddings | 100 | | 1K |
  | Pro (2.5, 3.1) | **0** | | **0** (not free) |

  A Gemini Pro consumer subscription doesn't change API limits.
- **Every live call goes to `gemini-3.5-flash-lite`.** **One call generates a topic's whole package** (misconceptions, 3-5 items with wrong options mapped to misconceptions, widget + params, refutations). It streams so item 1 renders early, and gets cached by the normalized topic.
- **Gemma 4 is the blind checker and the fallback.** It has 14.4K/day, but the **16K TPM** means a few calls a minute at most, so send it compact prompts. Use `gemma-4-31b-it` for the blind check and `gemma-4-26b-a4b-it` (MoE, faster) for reason classification and as a backup generator.
- **Flash (20/day) goes only to offline showcase pre-generation**, never to live calls.
- **Request budget: stay under 500/day on 3.5 Flash-Lite**, with `gemini-3.1-flash-lite` as overflow (see section 6). Quota resets at **midnight Pacific = 3:00 AM Eastern**.
- **Structured output:** `response_mime_type="application/json"` + `response_json_schema`. Keys stream in schema order. Always check `finish_reason == STOP` and validate with Pydantic. Gemma's JSON-schema support isn't documented officially, so test it in the first hour.
- **Billing:** we don't assume it. Paid prices are listed in section 2 in case I decide otherwise: 500 sessions on Flash-Lite would be about $5.

## 1. Models available via the API (Oct 2026)

From the [models page](https://ai.google.dev/gemini-api/docs/models), with free-tier status from our AI Studio page and [pricing](https://ai.google.dev/gemini-api/docs/pricing):

| Family | Model ID | Status | Free tier |
|---|---|---|---|
| Gemini 4 | `gemini-4-argon` | Stable flagship, 1M ctx | No ("not available on the Free tier") |
| Pro | `gemini-3.1-pro-preview` | Preview | No (0 RPM/0 RPD on our project) |
| Flash | `gemini-3.8-flash` | Stable, newest (Sep 2, 2026) | 5 RPM / 20 RPD |
| Flash | `gemini-3.6-flash` | Stable, "remains supported" ([3.8 guide](https://ai.google.dev/gemini-api/docs/generate-content/whats-new-gemini-3.8)) | 5 RPM / 20 RPD |
| Flash-Lite | **`gemini-3.5-flash-lite`** | Stable | **15 RPM / 500 RPD** |
| Flash-Lite | `gemini-3.1-flash-lite` | Stable | 15 RPM / 500 RPD |
| Gemma 4 | `gemma-4-31b-it`, `gemma-4-26b-a4b-it` | Open models served on the Gemini API ([Gemma on Gemini API](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api)) | 30 RPM / 16K TPM / 14.4K RPD. Free only; **no paid tier** ([pricing](https://ai.google.dev/gemini-api/docs/pricing)) |
| Shut down | `gemini-2.0-flash(-lite)`, `gemini-3-pro-preview`, `gemini-3.1-flash-lite-preview` | gone | - |

Don't use `gemini-flash-latest`-style aliases. Pin the IDs and confirm them once with `client.models.list()`.

### Thinking levels ([thinking docs](https://ai.google.dev/gemini-api/docs/thinking))

| Model | Default | Allowed |
|---|---|---|
| gemini-3.5-flash-lite | **minimal** | minimal, low, medium, high |
| gemini-3.6-flash | medium | minimal, low, medium, high |
| gemini-3.8-flash | medium | low, medium, high (`minimal` returns an error) |
| gemini-3.1-pro-preview | high | low, medium, high |
| Gemma 4 | | `thinkingLevel` "minimal" = off, "high" = on ([Gemma docs](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api)) |

- Python: `thinking_config=types.ThinkingConfig(thinking_level="minimal")` inside `GenerateContentConfig` ([3.8 guide](https://ai.google.dev/gemini-api/docs/generate-content/whats-new-gemini-3.8)). `thinking_budget` is legacy, and sending both gives a 400 ([Gemini 3 guide](https://ai.google.dev/gemini-api/docs/gemini-3)). `minimal` doesn't guarantee zero thinking.
- Thinking tokens count against `max_output_tokens` and are billed as output, so lower the level instead of capping tokens ([thinking docs](https://ai.google.dev/gemini-api/docs/thinking)).
- 3.6+ and 4 **ignore `temperature`/`top_p`/`top_k`** and will 400 on them in a future release, so don't send them ([troubleshooting](https://ai.google.dev/gemini-api/docs/troubleshooting)).

### Which model for which job (free-tier plan)

| Job | Model + level | Calls | Why |
|---|---|---|---|
| **Live generation**: full topic package in one call | `gemini-3.5-flash-lite`, minimal (try `low` if quality is weak; measure first) | 1 per fresh topic | 500/day, 15 RPM, fastest output (~449 tok/s, [AA](https://artificialanalysis.ai/models/gemini-3-5-flash-lite/providers)) |
| **Overflow generation** | `gemini-3.1-flash-lite`, minimal | when 3.5 is exhausted | Same 15 RPM/500 per day listing. Check in AI Studio whether its counter is separate from 3.5's. |
| **Blind check**: stems + options only, model answers each one | `gemma-4-31b-it`, thinking high if latency allows, else minimal | 1 per fresh topic, in the background | A different model family from the generator, so its errors are less correlated with the generator's (the Chain-of-Verification idea in any-topic-engine.md). Almost no daily cost against 14.4K. Keep the prompt ≤ ~3K tokens because of the 16K TPM. |
| **Reason classification**: free-text "why" mapped to a misconception id | `gemma-4-26b-a4b-it`, minimal; fallback is local keyword/embedding match | 1 per answered item | Keeps Flash-Lite quota for generation. Tiny prompt (~500 tokens), so 16K TPM allows ~25-30/min. |
| **Fallback generator** if Flash-Lite is out | `gemma-4-26b-a4b-it` | rare | It's slower and its JSON-schema support is untested, so validate hard and show "try a showcase topic" if it fails. Watch TPM: a full package is ~2-3K input. |
| **Showcase pre-generation** (offline, hand-checked) | `gemini-3.8-flash` medium, then `gemini-3.6-flash` | ≤ 20/day each | Best quality we get for free. 15 topics fit in one day's Flash quota per model. |

## 2. Rate limits, 429s, billing, paid prices

Official ([rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)):
- Limits are RPM, TPM (input tokens) and RPD, and going over **any one** of them errors. They're **per project, not per key**, so extra keys in the same project add nothing. **RPD resets at midnight Pacific (3:00 AM ET).** Google no longer publishes free-tier numbers; they're "viewable in AI Studio" and "not guaranteed".
- Free tier = "active project or free trial", so **no billing needed**. Tier 1 needs a linked billing account.
- 429 = `RESOURCE_EXHAUSTED`. The [API errors page](https://ai.google.dev/gemini-api/docs/api-errors) splits it into `rate_limit_exceeded` (per minute: back off and retry), `quota_exceeded` (**daily: wait for the reset, retrying won't help**) and `too_many_requests`. Retry 429/503 with backoff + jitter, and never retry 400/402/403 ([troubleshooting](https://ai.google.dev/gemini-api/docs/troubleshooting)).
- **Free-tier prompts and outputs are used to improve Google products** ([pricing](https://ai.google.dev/gemini-api/docs/pricing)), so keep personal data out of prompts.
- Free tier has no Batch/Flex. Google Search grounding isn't free for these models.
- Don't spread keys across extra projects to dodge limits. @luanamaldaner having their own key for their own dev work is fine.

### Paid prices per 1M tokens, Standard tier (only if I link billing)

Source: [ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing). Output prices include thinking tokens.

| Model | Input | Output | Cache read |
|---|---|---|---|
| `gemini-3.5-flash-lite` | $0.30 | $2.50 | $0.03 |
| `gemini-3.1-flash-lite` | $0.25 (text/img/video), $0.50 audio | $1.50 | $0.025 |
| `gemini-3.8-flash` | $0.75 to Dec 31 2026, then $1.50 | $3.75, then $7.50 | $0.075, then $0.15 |
| `gemini-3.6-flash` | $0.75, then $1.50 | $3.75, then $7.50 | $0.075, then $0.15 |
| `gemini-3.1-pro-preview` | $2.00 (≤200k prompt), $4.00 (>200k) | $12.00 / $18.00 | $0.20 / $0.40 |
| `gemini-4-argon` | $2.00 to Nov 30 2026, then $4.00 | $10.00, then $20.00 | $0.10 (implicit only) |
| Gemma 4 | free only; paid "not available" | | |

Batch and Flex are 50% off on paid tiers.

## 3. Structured output (google-genai 2.31.0)

**SDK facts, read from the wheel source:** `GenerateContentConfig` has `response_mime_type`, `response_schema` (OpenAPI-subset or a Pydantic class), `response_json_schema` (plain JSON Schema dict), `thinking_config`, `max_output_tokens`, `system_instruction`, `cached_content`, `service_tier`, `http_options`. `response.parsed` gives a dict or Pydantic object. `usage_metadata` has `thoughts_token_count` and `cached_content_token_count`. `response_schema` and `response_json_schema` are mutually exclusive.

The docs now lead with the new Interactions API (`client.interactions.create(..., response_format={...})`, [structured output](https://ai.google.dev/gemini-api/docs/structured-output)). `generate_content` is still fully supported and documented ([generate-content/structured-output](https://ai.google.dev/gemini-api/docs/generate-content/structured-output)). Use `generate_content`.

**Supported keywords** (SDK docstring): `$id $defs $ref $anchor type format title description enum items prefixItems minItems maxItems minimum maximum anyOf oneOf (= anyOf) properties additionalProperties required`, plus non-standard `propertyOrdering`. Types: string, number, integer, boolean, object, array, null (nullable = `["string","null"]`). String formats: date-time, date, time.
- **Ignored:** `pattern`, `minLength/maxLength`, `const`, `allOf`, `not`, `uniqueItems`, etc. "The model ignores unsupported properties", so enforce these in Pydantic. Cyclic `$ref` is only partly unrolled and is allowed only in non-required fields.
- **Ordering:** "the model will produce outputs in the same order as the keys in the schema" ([docs](https://ai.google.dev/gemini-api/docs/generate-content/structured-output)). Order the package so `concept`, `widget`, `widget_params`, `misconceptions` and `items[0]` come first, and render as they stream.
- **Size:** "The API may reject very large or deeply nested schemas." No number is given. Keep depth ≤ ~4 and enums short. Since we're doing a single call, keep the schema lean: ids instead of repeated text, with refutations keyed by misconception id.
- **Enums** work for `widget` (8 names) and misconception ids. An enum guarantees a valid name, not a good one, so re-check in Pydantic. For single-label classification, `response_mime_type="text/x.enum"` returns the bare value ([SDK docs](https://googleapis.github.io/python-genai/)).
- **Tools + structured output** is Preview, Gemini 3/4 only, so it's not for Flash-Lite-free grounding anyway.
- **Don't repeat the schema in the prompt** (SDK docs say it lowers quality). Use `description` fields.
- **Gemma 4:** official docs list system instructions, thinking, function calling and search grounding, but **don't mention JSON mode/schemas** ([Gemma on Gemini API](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api)). [Phil Schmid's guide](https://www.philschmid.de/gemma-4-gemini-api) says it does structured output natively. **Test `response_json_schema` on Gemma in hour 1.** If it's rejected, ask for JSON in the prompt, then `model_validate_json` with one repair retry.

**Streaming:** `client.models.generate_content_stream(...)`. "Streamed chunks are valid partial JSON strings that can be concatenated" ([docs](https://ai.google.dev/gemini-api/docs/structured-output)). Parse the growing buffer with `jiter.from_json(buf, partial_mode="trailing-strings")` (ships with pydantic-core) on the server, or the npm `partial-json` package on the client. With SSE, errors arrive as `event_type: "error"` events ([API errors](https://ai.google.dev/gemini-api/docs/api-errors)).

**Known failure modes**
1. **Truncation.** Hitting `max_output_tokens` leaves `response.text`/`parsed` as `None` or invalid JSON ([python-genai #1039](https://github.com/googleapis/python-genai/issues/1039), [forum](https://discuss.ai.google.dev/t/gemini-batch-api-invalid-json-when-finish-reason-is-max-tokens/143697)). Set it to ~8192 and treat `finish_reason != STOP` as failure.
2. **Repetition loops inside JSON**, e.g. digits repeating until MAX_TOKENS, reported on Flash in 2026. temperature 0 doesn't help ([forum 1](https://discuss.ai.google.dev/t/structured-output-repetition-loop-inside-a-json-number-literal-runs-to-max-tokens-flash-vertex/175138), [forum 2](https://discuss.ai.google.dev/t/gemini-3-7-flash-schema-constrained-json-output-degenerates-into-repeated-0-until-maxoutputtokens-regression-vs-gemini-3-flash-preview/178681)). Fixes: put min/max on every number, make every field required, add "Be concise" ([troubleshooting](https://ai.google.dev/gemini-api/docs/troubleshooting)), and **abort the stream at ~15 KB or 30 s**.
3. **Valid JSON, wrong content** ("always validate values in your application"). Compute-not-trust plus the blind check cover this.
4. **SAFETY/RECITATION/PROHIBITED_CONTENT** finish reasons on odd topics. Route these to "try a showcase topic".

## 4. Latency

Third-party (Artificial Analysis, AI Studio endpoint, 10k-token input, 72 h medians), so rough:

| Model / setting | TTFT | Speed | 500 tok end-to-end | Source |
|---|---|---|---|---|
| 3.5 Flash-Lite (AA default setting) | 6.9 s | 449 tok/s | 8.0 s | [AA](https://artificialanalysis.ai/models/gemini-3-5-flash-lite/providers) |
| 3.5 Flash, minimal (no reasoning) | 0.80 s | 192 tok/s | 3.4 s | [AA](https://artificialanalysis.ai/models/comparisons/gemini-3-6-flash-vs-gemini-3-5-flash-minimal) |
| 3.6 Flash, high | 14.5 s | 224 tok/s | 16.7 s | same |
| 3.8 Flash, high | 13.3-22.6 s | 147-305 tok/s | 26.5 s | [AA](https://artificialanalysis.ai/models/gemini-3-8-flash/providers), [eesel](https://www.eesel.ai/blog/gemini-3-8-flash-review) |

What this means for us:
- Reasoning-on settings take 13-23 s to the first token, which is unusable live. Always set the thinking level explicitly.
- Estimate for the one-call package on 3.5 Flash-Lite at minimal with ~2.5K input and ~3-4K output: **TTFT ~1-3 s** (AA's 6.9 s was measured with 10K input at its default setting), at ~400 tok/s that's **~8-12 s to finish**. **Item 1 is on screen in ~3-4 s** if the schema puts it early. The judge's prediction time on item 1 hides the rest.
- Gemma 4: no reliable public latency numbers for the Gemini API endpoint. It's background-only for us, so latency matters less. Measure it.
- **Benchmark tonight on our prompt:** 10 topics on 3.5 Flash-Lite (minimal vs low) plus 10 Gemma blind checks. That's ~20 Flash-Lite requests. Log TTFT, total time, tokens, finish_reason and validation pass rate.

## 5. Context caching: skip it

- **Implicit** caching is automatic, but it needs a shared prefix of ≥4,096 tokens on Flash/Pro/Argon ([caching](https://ai.google.dev/gemini-api/docs/caching)). Our prompt is below that. Flash-Lite has **no context caching on the free tier** ([pricing](https://ai.google.dev/gemini-api/docs/pricing)).
- **Explicit** caching (`client.caches.create`, default TTL 1 h) only works on Gemini 3/2.5 via generateContent ([caching](https://ai.google.dev/gemini-api/docs/generate-content/caching)), and Google calls it a paid feature.
- Neither raises RPM or RPD, which is our real limit. Put the static prompt first anyway (it's free if it ever hits), and rely on **our own response cache**.

## 6. Request budget and cost

**Per fresh topic:** 1 Flash-Lite request (generation) + 1 Gemma request (blind check) + 3-5 Gemma requests (reason classification as the judge answers). Cache and showcase hits cost **0** requests.

**Daily request budget on `gemini-3.5-flash-lite` (500/day, resets 3 AM ET):**

| Window | Budget | Use |
|---|---|---|
| Fri night until the 3 AM reset | ≤ 200 | Prompt iteration, schema tests, latency bench. Use fixtures for frontend work. |
| Each day, build hours | **≤ 25/hour** of testing, hard-stopped by a counter in the backend | Dev and testing |
| Judging day, after the 3 AM reset | ≤ 50 dev, ≤ 30 pre-warm, **≥ 400 reserved for the demo** | Freeze dev calls on the demo key once pre-warm is done |
| Overflow | `gemini-3.1-flash-lite` (another 500, if it's a separate counter) | When 3.5 runs out |

- Add a **request counter** per model in the backend (SQLite row per model per PT-day) and show it on a hidden `/admin` page. Refuse live generation when 3.5 Flash-Lite passes 480/day and switch to 3.1 Flash-Lite, then Gemma, then showcase.
- RPM: 15/min on Flash-Lite is plenty for one judge at a time. Gemma's 16K TPM is the tight one: ~5 blind checks/min at 3K tokens each, or ~30 classifications/min at 500 each. Queue Gemma calls through one async worker with a token-bucket on input tokens.
- **Flash (20/day per model)** is for showcase generation only: 15 topics on 3.8 Flash, regen the bad ones on 3.6 Flash.

**Cost if billing ever gets linked** (paid Standard, one-call design): about 2.5K input + 4K output on 3.5 Flash-Lite = $0.00075 + $0.010 = **~$0.011/session**. **500 sessions ≈ $5.40**, and 2,000 ≈ $22. Gemma has no paid tier, so it stays on free limits either way. We're not assuming billing.

## 7. Demo-safe design

1. **Showcase topics on disk.** Make 12-15 hand-checked `showcase/<slug>.json` files, generated with 3.8 Flash and labeled "reviewed". They double as dev fixtures, so frontend work costs 0 requests.
2. **Response cache keyed by the normalized topic.** Lowercase, strip punctuation/articles, collapse whitespace, singularize, plus an alias map. Key = `(topic_key, PROMPT_VERSION)`. Store only sessions that passed Pydantic + compute + the Gemma blind check. SQLite or a JSON file is fine.
3. **Backoff that understands quota.** `HttpOptions(timeout=30000, retry_options=HttpRetryOptions(attempts=3, initial_delay=1, max_delay=8, exp_base=2, http_status_codes=[429,500,503,504]))` (SDK default is 5 attempts with up to 60 s waits, too slow live). If the 429 is a daily `quota_exceeded`, don't retry: mark that model exhausted until 3 AM ET and move on.
4. **Fallback chain for generation:** `gemini-3.5-flash-lite` → `gemini-3.1-flash-lite` → `gemma-4-26b-a4b-it` → showcase picker. Show a small "engine: X" tag. The blind checker is always Gemma 31B (a different family from the generator). If the generator *was* Gemma, check with the other Gemma size.
5. **Hard deadlines.** Item 1 must stream within 8 s, otherwise go to the next model. The full package gets 30 s. Abort if the buffer passes ~15 KB.
6. **Failure UX.** "That one's taking a while. Try one of these while it finishes:" with 4 showcase chips closest to the typed topic (local keyword match; embeddings are only 1K/day). Keep generating in the background and toast when it's ready. Never show a stack trace or an endless spinner.
7. **Pre-warm before judging.** After the 3 AM ET reset, stop dev calls on the demo project. 30-45 min before judging, run the ~15-25 topics judges are most likely to type (Monty Hall, compound interest, herd immunity, seasons, gravity/falling objects, inflation, greenhouse effect, gambler's fallacy, evolution, photosynthesis, black holes, Florida hurricanes, alligators...) through the full pipeline so they're cached. That's ≤ 30 requests. Then do one live call per model on the demo laptop and network.
8. **`DEMO_OFFLINE=1` kill switch.** Serve cache and showcase only, in case the venue wifi dies.
9. **Log every call:** model, level, TTFT, total time, tokens, finish_reason, valid?, blind-check agree? That gives us real pitch numbers ("N% of generated items passed an independent blind check").

## Recommended config

```text
SDK: google-genai==2.31.0 (pin); confirm IDs with models.list at the event

GEN_MODEL       = gemini-3.5-flash-lite  thinking_level=minimal  max_output_tokens=8192  stream=True
GEN_FALLBACKS   = [gemini-3.1-flash-lite@minimal, gemma-4-26b-a4b-it@minimal]
CHECK_MODEL     = gemma-4-31b-it         thinking_level=minimal (try high if latency ok)  max_output_tokens=2048
CLASSIFY_MODEL  = gemma-4-26b-a4b-it     thinking_level=minimal  max_output_tokens=128   (fallback: local keyword match)
SHOWCASE_MODEL  = gemini-3.8-flash       thinking_level=medium   (offline, <=20/day; then gemini-3.6-flash)

structured: response_mime_type="application/json", response_json_schema=Pkg.model_json_schema()
            (Gemma: test schema support; else prompt-for-JSON + validate + 1 repair retry)
never send: temperature/top_p/top_k; thinking_budget together with thinking_level
http_options: timeout=30000 ms; retry attempts=3, initial_delay=1, max_delay=8, codes 429/500/503/504
deadlines: item 1 <= 8 s, package <= 30 s, abort stream > 15 KB
budgets: 3.5-lite <= 480/day (switch at 480), <= 25/hour dev; Gemma input-token bucket < 16K/min
cache key: (normalize(topic), PROMPT_VERSION); store only validated + blind-checked packages
quota reset: 00:00 PT = 03:00 ET
```

## Structured call sketch (pseudocode, not committed code)

1. Create the client once from the env key with http_options (30 s timeout, retry_options as above).
2. Define a Pydantic `Package` with fields in render order: concept, widget (Literal of 8), widget_params, misconceptions[{id,label,why_tempting}], items[3..5]{stem, options[{text, misconception_id|null}], answer}, refutations keyed by misconception id.
3. Config: `response_mime_type="application/json"`, `response_json_schema=Package.model_json_schema()`, `thinking_config={"thinking_level":"minimal"}`, `max_output_tokens=8192`, `system_instruction=STATIC_PROMPT`.
4. `key = normalize(topic)`. If it's in the cache or showcase, return it immediately (0 requests).
5. For each model in the chain that isn't exhausted and is under budget, increment its counter and call `client.models.generate_content_stream(model=m, contents=topic_prompt, config=cfg)`.
6. For each chunk, append `chunk.text` to buf, run `jiter.from_json(buf, partial_mode="trailing-strings")`, and push newly complete items to the browser over SSE. Abort past the time or size limits.
7. At the end, require `finish_reason == STOP`, then `Package.model_validate_json(buf)` plus our checks (widget compute finite, every wrong option maps to a listed misconception).
8. On a daily 429, mark the model exhausted until 03:00 ET and continue the chain. On a per-minute 429, timeout or invalid output, try the next model once.
9. If everything fails, return `{fallback: true, suggestions: nearest_showcase(topic)}` for the "try a showcase topic" UI.
10. On success, queue the Gemma 31B blind check (stems + options only, no key). Drop items it disagrees on, and cache the package once it's checked.

## Open items

- In the first hour, test `response_json_schema` and streaming on `gemma-4-31b-it` / `gemma-4-26b-a4b-it`.
- In AI Studio, check whether 3.5 and 3.1 Flash-Lite have separate 500/day counters, and the same for each Flash model's 20/day.
- Bench 3.5 Flash-Lite minimal vs low on 10 topics (quality + time) before locking the prompt.

## Prompt v3 trial (2026-10-17)

Why: the 25-topic v2 trial (2026-10-16) gave `estimate` on 60 of 60 kept items, so a typed
topic was a quiz with no picture. v3 asks for a `curve` or `distribution` on at least one
question per quantitative round, with 3 worked examples in the prompt (compound growth curve
with a rate knob, dice-sum distribution, half-life curve asking "when does it reach 50 mg").
Issue #117.

What changed in code (PROMPT_VERSION 3):
- Compact schema: `ask_x` / `ask_y` (the spot on the curve the question asks about) and an
  explore knob (`explore_param/label/min/max/step/default`) for curve items. A knob is kept
  only if it's a plain name (not `x`) that the curve's expr actually uses.
- New checks: the curve must draw (finite and |y| < 1e12 at 81 points, no pole: a sign flip
  is bisected and dropped if the values grow), at the asked knob value and at both ends of the
  knob range; with `ask_x` the answer must equal the curve there (2%); with `ask_y` the curve at
  the answer must hit that y, or the answer must be within one slider step of the exact
  crossing ("day 16" for "when does it pass 50,000"). A correct band that no slider stop can
  land in is dropped. Flat curves are allowed (fall time vs mass is flat: that's the lesson).
- One invalid question (no correct option, no answer_expr) now drops that question instead of
  rejecting the whole round. In v2 this was the top failure (7 of 10 bad rounds).
- `log2` / `log10` allowed in exprs (mathjs has them; Big O curves need them).

How: `api/scripts/trial.py` with a temp cache dir (production cache untouched), hard cap on
generation calls. Run 1: 12 topics on the first v3 code. Run 2: 6 topics (the 3 failures plus
3 whose curve items were dropped) after the per-question drop, flat-curve and log2 fixes.
Raw replies of run 2 were re-checked offline with the final code.
27 generation calls in total (19 + 8), 0 blind-check calls (every kept item had a computed
answer, so nothing needed a second opinion). Topics: radioactive half-life, the birthday
problem, why heavier objects don't fall faster, projectile motion, exponential growth of a
pandemic, the law of large numbers, regression to the mean, Newton's law of cooling, Big O
notation, the sunk cost fallacy, why the sky is blue, how vaccines work.

| Metric | v2 (25 topics) | v3 run 1 (12) | v3 run 2 (6) |
|---|---|---|---|
| Rounds delivered | 24/25 (96%) | 9/12 (75%) | 5/6 (83%) |
| Passed on the first call | 18/25 (72%) | 8/12 (67%) | 5/6 (83%) |
| Kept items that are curve or distribution | 0/60 | 8/14 (57%) | 6/9 (67%) |
| Latency of delivered rounds, median (s) | 27.6 | 6.8 | 7.2 |
| Latency max (s) | 59.7 | 47.2 | 29.8 |
| Items dropped by checks (in delivered rounds) | 12/72 (17%) | 13/27 (48%) | 6/15 (40%) |

Latest round per topic (12 topics, the run 2 round where there is one, re-checked with final
code): all 12 delivered in at least one run. Widget mix of the 20 kept items: curve 10,
distribution 3, estimate 7. 9 of 12 rounds have at least one curve or distribution; the 3
without are the sunk cost fallacy and how vaccines work (no honest formula, so estimate is the
right fallback) and Newton's law of cooling (its two curve items were dropped because the
answer didn't match the curve: the check working). 5 kept curves have a working knob (half-life
x2, launch speed, cliff height, gravity); the model also sent 4 knobs its expr never used, which
the final code drops.

Latency fell from a 27.6 s to about a 7 s median mainly because no item needed the blind check
(v2 spent up to 8 s per round on it, mostly failing). The two slow rounds (47.2 s, 29.8 s) were
slow API replies (not measured further).

Failures: all 4 failed topic attempts were content problems on the Gemini models (choice items
with no options or no correct option, sliders without bands) followed by a 500/504 from
gemma-4-26b on every call it got (4 of 4). The Gemma fallback isn't adding anything right now.

What the new checks caught (all would have shown a wrong picture or wrong verdict):
radioactive decay q3 ("curve at the answer x=10 is 100, not 25"), pandemic q2 ("curve at x=16
is 65,536, not 50,000"; this one is now accepted by the one-step rule), Newton's cooling q1/q2
(answer 42.9 vs curve 54.4 at x=20), vaccines q1 (curve 516 at x=14 vs answer 14), heavier
objects q3 (correct band 9.80-9.82 with a 0.5 slider step: no stop could ever be right), Big O
q2 (`log2`, now allowed).

Spot-checks (I recomputed every number by hand):
- **Radioactive half-life** (run 1). q1: 100 g, half-life 8 days, after 24 days: 100 x 0.5^3 =
  12.5 g; key 12.5, inside the correct band 6.5-15. Curve `100*0.5^(x/h)` with a half-life
  knob, default 8. q2: C-14, 80 g down to 10 g = 3 half-lives = 3 x 5730 = 17,190 years; curve at
  17,190 = 10.0 (ask_y check). Both correct. Weak: the "everything decays after two half-lives"
  tag on answers over 15.5 g doesn't match that misconception (it predicts 0).
- **Projectile motion** (run 1). q1: straight up at 20 m/s, time to the top = 20/9.8 = 2.04 s;
  key 2.04 in band 1.8-2.2; curve `v*x - 4.9*x^2` with a launch-speed knob. q3: horizontal throw
  vs drop from 20 m: same time, sqrt(2 x 20/9.8) = 2.02 s; key "same time", curve `h - 4.9*x^2`
  hits 0 at 2.02 (ask_y check). Both correct and both good pictures.
- **Why the sky is blue** (run 2). q1: (700/400)^4 = 9.38; key 9.38 in band 3.6-12. q2: violet
  vs blue (470/380)^4 = 2.34; key 2.33 in band 1.71-2.5. q3: much thicker atmosphere ->
  red/orange (as at sunset), keyed correct. Numbers right; v2's invented percentages are gone.
  The model's knobs on both curves weren't in the expr, so the final code drops them.

Also read: **the law of large numbers** (run 2) is wrong in a way no check sees. "Days with
over 60% boys: 100 vs 1,000 births a day, how many times rarer?" is keyed 50 as a bare
literal. Exact binomial: P(X >= 61 | n=100) = 0.0176 and P(X >= 601 | n=1000) = 9.0e-11, so it's
about 2 x 10^8 times rarer. Lesson: an answer_expr that is just a number is unverified.
**Regression to the mean** (run 2): 9 heads in 10, expected heads in the next 10 = 5, binomial
sampler n=10 p=0.5: correct. **Heavier objects** (run 2): fall time from 50 m in a vacuum =
sqrt(100/9.81) = 3.19 s, plotted as a flat line against mass with a gravity knob: correct and
exactly the lesson.

Next:
- Flag (or drop) items whose answer_expr is a bare number on topics where it should be
  computed (the law of large numbers case); a distribution item could compute its answer from
  the sampler (tail share, mean) instead of trusting the model.
- Band-to-misconception tags are still often arbitrary (radioactive q1); the verdict card
  is only as good as these tags.
- The web Curve widget must evaluate the expr with the knob (`{x, [explore.param]:
  value}`), and can mark `ask_x` / `ask_y` on the plot.
- Drop or fix the Gemma fallback (0 rounds from it in 2 trials, 500/504 every time here).

## Engine v4 trial (2026-10-17)

Local runs with the real key against `gemini-3.5-flash-lite` (minimal thinking, structured output), `api/scripts/trial.py`, a temp cache each run, model calls capped per run. Truth is computed by code from each spec (`api/app/spec.py`); a spec counts as built only if it validates, computes, matches its own claimed number within 2%, and its correct band holds the computed truth. 62 calls in total over three runs (27 + 22 + 13): run 1 came in far below target, so I fixed it and measured again, and the visual-only decision (Sat 1:03 PM) needed a calculus/orgo check.

**Run 1: first v4 prompt; a rejected spec retried on the next model without being told why.** 15 topics, 27 calls: **2/15 built**, 12 failed checks twice, 1 gibberish refused before any call. The failures were mostly fixable: bands naming misconception ids that weren't in the list (4), 3.1 Flash-Lite leaving `x_min/x_max` null (3), names in `expr` that weren't declared (`th`, `P`, `light`) or `tanh` (4), percents given where fractions belong (`p = 50`) (2), two touching "correct" bands (3), and claimed numbers that didn't match the spec (5). The last group is the check doing its job: e.g. a birthday spec asking "how many people for 50%?" while the spec computes the chance for 23.

**Run 2: the retry goes back to the same model with the failed check, plus a tighter prompt and harmless fixes in code** (percent to fraction, merging touching correct bands, dropping a knob that was also declared as a variable). Same 15 topics, 22 calls:
| | result |
|---|---|
| built | **10/15** (9 visual + 1 stepper, which is now removed) |
| honest no-fit | 4 real topics failed checks twice (radioactive half-life, gambler's fallacy, projectile motion, photosynthesis); gibberish refused with 0 calls |
| latency (built) | 1 call: 5.2-6.0 s (5 topics); with the retry: 11.0-12.0 s (5 topics); median 6.0 s |
| widget mix | curve 6, sampler 3 (base_rate_test, binomial_count, birthday_match), stepper 1 |
| compare | 7/10 specs named a second case + shared principle, but 0 had a second case that compiled, so compare screens are text-only for now |

**Run 3: visual-only (no stepper/dial), calculus modes, approximate label.** 8 topics, 13 calls:
| topic | result |
|---|---|
| derivative | curve, `slope`, k·x² at x = 3 → 6 (2 calls, 45.8 s: one call took ~34 s) |
| the definite integral | curve, `area`, ∫₀⁴ x² → 21.33, knob = rectangles (1 call, 6.5 s) |
| limits in calculus | curve, `limit`, (x²−4)/(x−2) at 2 → 4 (2 calls, 14.1 s) |
| photosynthesis | curve marked `approximate` (light-saturation curve), 75% (2 calls, 12.6 s) |
| SN2 reactions (orgo) | honest no-fit from the model: "complex reaction mechanisms … cannot be adequately represented by a simple numerical curve" (1 call) |
| the French Revolution | honest no-fit from the model (1 call) |
| radioactive half-life, projectile motion | failed checks twice (undeclared `N0`, `g`) → no-fit with nearest topics |

**Hand-checked by recomputing (8 specs):** Newton's cooling 20 + 70·e^(−0.05·20) = 45.75 °C ✓; inflation 100/1.03²⁵ = $47.76 ✓; Moore's law 1000·2^(10/2) = 32,000 ✓; hash collisions (365 outputs, 23 items) 50.73% ✓; airport screening 1e-5·0.99 / (1e-5·0.99 + 0.99999·0.01) = 0.0989% ✓; derivative of x² at 3 = 6 ✓; ∫₀⁴ x² = 64/3 ✓ and 30 left rectangles = 20.28 ✓; terminal velocity 50.4·(1 − e^(−8)) = 50.38 ✓. Two specs were numerically right but bad pictures, which I turned into new checks: herd immunity put R0 on the knob and never used x (flat curve → now "expr must use x"), and the limit spec used a fake knob `+ k − k` (now "the knob doesn't change the curve"). Undeclared names now get a plain reason ("expr uses N0 …") so the retry can fix them; half-life and projectile motion failed on exactly that.

**Takeaways.** Expect about 2 in 3 quantitative topics to build live, at ~6 s (one call) or ~12 s (with the retry), with an occasional 30-45 s call. Non-quantitative topics (history, reaction mechanisms) come back as honest no-fits. Gibberish never reaches the model. Every truth shown was recomputed by code; the model's number is only a cross-check. Since live building is slow and misses about a third of topics, the plan stays: pre-build and hand-check 20-30 topics with v4 and serve them cached, with live building as the extra.
