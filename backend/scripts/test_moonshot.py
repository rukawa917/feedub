"""Test script to investigate Moonshot/Kimi API timeout behavior.

Usage:
    uv run python scripts/test_moonshot.py

Tests:
1. Small request (should succeed quickly)
2. Large request near context limit (tests if API hangs)
3. Request exceeding context limit (tests error handling)
"""

import asyncio
import time
import os

import litellm

MODEL = "moonshot/kimi-k2-0905-preview"
API_KEY = os.environ.get("MOONSHOT_API_KEY")


async def test_small_request():
    """Test 1: Small request — should complete quickly."""
    print("\n[Test 1] Small request (100 tokens)...")
    start = time.time()
    try:
        resp = await asyncio.wait_for(
            litellm.acompletion(
                model=MODEL,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": "Say hello in 10 words."},
                ],
                max_tokens=100,
                timeout=30,
            ),
            timeout=40,
        )
        elapsed = time.time() - start
        print(f"  OK in {elapsed:.1f}s: {resp.choices[0].message.content[:100]}")
        print(f"  Tokens: {resp.usage.prompt_tokens} in / {resp.usage.completion_tokens} out")
    except Exception as e:
        elapsed = time.time() - start
        print(f"  FAILED after {elapsed:.1f}s: {type(e).__name__}: {e}")


async def test_large_request():
    """Test 2: Large request (~200K tokens) — tests if API hangs on big payloads."""
    # Generate ~200K tokens of content (each Korean char ≈ 2-3 tokens)
    # Use repetitive text to simulate real message data
    filler = "비트코인 가격이 급등했습니다. 시장 분석가들은 이번 상승세가 지속될 것으로 예상합니다. " * 5000
    token_est = litellm.token_counter(
        model=MODEL,
        messages=[
            {"role": "system", "content": "Summarize."},
            {"role": "user", "content": filler},
        ],
    )
    print(f"\n[Test 2] Large request (~{token_est:,} tokens)...")
    start = time.time()
    try:
        resp = await asyncio.wait_for(
            litellm.acompletion(
                model=MODEL,
                messages=[
                    {"role": "system", "content": "Summarize the following in 2 sentences."},
                    {"role": "user", "content": filler},
                ],
                max_tokens=200,
                timeout=120,
            ),
            timeout=130,
        )
        elapsed = time.time() - start
        print(f"  OK in {elapsed:.1f}s: {resp.choices[0].message.content[:100]}")
        print(f"  Tokens: {resp.usage.prompt_tokens} in / {resp.usage.completion_tokens} out")
    except asyncio.TimeoutError:
        elapsed = time.time() - start
        print(f"  TIMEOUT after {elapsed:.1f}s — API hung without responding")
    except Exception as e:
        elapsed = time.time() - start
        print(f"  FAILED after {elapsed:.1f}s: {type(e).__name__}: {e}")


async def test_over_limit_request():
    """Test 3: Request exceeding 262K context — tests if API returns error or hangs."""
    # Generate ~300K tokens
    filler = "비트코인 가격이 급등했습니다. 시장 분석가들은 이번 상승세가 지속될 것으로 예상합니다. " * 8000
    token_est = litellm.token_counter(
        model=MODEL,
        messages=[
            {"role": "system", "content": "Summarize."},
            {"role": "user", "content": filler},
        ],
    )
    print(f"\n[Test 3] Over-limit request (~{token_est:,} tokens, limit 262K)...")
    start = time.time()
    try:
        resp = await asyncio.wait_for(
            litellm.acompletion(
                model=MODEL,
                messages=[
                    {"role": "system", "content": "Summarize the following in 2 sentences."},
                    {"role": "user", "content": filler},
                ],
                max_tokens=200,
                timeout=30,
            ),
            timeout=40,
        )
        elapsed = time.time() - start
        print(f"  UNEXPECTED OK in {elapsed:.1f}s: {resp.choices[0].message.content[:100]}")
    except asyncio.TimeoutError:
        elapsed = time.time() - start
        print(f"  TIMEOUT after {elapsed:.1f}s — API hung instead of returning error")
    except Exception as e:
        elapsed = time.time() - start
        err_str = str(e)[:200]
        print(f"  Expected error in {elapsed:.1f}s: {type(e).__name__}: {err_str}")


async def test_litellm_timeout_behavior():
    """Test 4: Does litellm's timeout= param actually work for Moonshot?"""
    filler = "Test message. " * 500
    print(f"\n[Test 4] litellm timeout=5s (should timeout quickly)...")
    start = time.time()
    try:
        resp = await litellm.acompletion(
            model=MODEL,
            messages=[
                {"role": "system", "content": "Write a 2000-word essay about AI."},
                {"role": "user", "content": filler},
            ],
            max_tokens=4096,
            timeout=5,  # Very short timeout
        )
        elapsed = time.time() - start
        print(f"  Completed in {elapsed:.1f}s (timeout NOT enforced if >5s)")
    except Exception as e:
        elapsed = time.time() - start
        print(f"  Error after {elapsed:.1f}s: {type(e).__name__}: {str(e)[:150]}")
        if elapsed > 10:
            print(f"  WARNING: Took {elapsed:.1f}s despite timeout=5s — litellm timeout is NOT reliable for this provider")
        else:
            print(f"  OK: Timeout enforced correctly")


async def main():
    if not API_KEY:
        print("ERROR: MOONSHOT_API_KEY not set")
        return

    print(f"Model: {MODEL}")
    try:
        info = litellm.get_model_info(MODEL)
        print(f"Context window: {info.get('max_input_tokens'):,} tokens")
    except Exception:
        print("Could not get model info")

    await test_small_request()
    await test_litellm_timeout_behavior()
    await test_large_request()
    await test_over_limit_request()

    print("\n--- Done ---")


if __name__ == "__main__":
    asyncio.run(main())
