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
- **Billing:** we don't assume it. Paid prices are listed in section 2 in case I decides otherwise: 500 sessions on Flash-Lite would be about $5.

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
- Don't spread keys across extra projects to dodge limits. Luana having her own key for her own dev work is fine.

### Paid prices per 1M tokens, Standard tier (only if I links billing)

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
