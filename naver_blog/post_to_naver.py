# -*- coding: utf-8 -*-
"""
열방교회 네이버 블로그 자동 포스팅 스크립트
사용법: py post_to_naver.py
"""

import os
import sys
import io
import json
import time
from pathlib import Path
from dotenv import load_dotenv

# Windows 한글 인코딩 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# .env 파일 로드
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

NAVER_ID = os.getenv("NAVER_ID")
NAVER_PW = os.getenv("NAVER_PW")

if not NAVER_ID or not NAVER_PW:
    print("[오류] .env 파일에 NAVER_ID와 NAVER_PW를 입력해주세요!")
    sys.exit(1)

# 포스팅할 글 정보 읽기
post_file = Path(__file__).parent / "post_content.json"
if not post_file.exists():
    print("[오류] post_content.json 파일이 없습니다!")
    sys.exit(1)

with open(post_file, "r", encoding="utf-8") as f:
    post = json.load(f)

title = post.get("title", "")
content = post.get("content", "")
category = post.get("category", "")

if not title or not content:
    print("[오류] 제목과 내용을 입력해주세요!")
    sys.exit(1)

print(f"[준비] 포스팅 준비 중...")
print(f"  제목: {title}")
print(f"  카테고리: {category}")

from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. 네이버 로그인
        print("\n[1단계] 네이버 로그인 중...")
        page.goto("https://nid.naver.com/nidlogin.login")
        page.wait_for_load_state("networkidle")

        # 아이디/비번 입력 (새 네이버 로그인 UI 대응)
        page.wait_for_selector("input[placeholder*='아이디'], #id", timeout=10000)
        id_input = page.locator("input[placeholder*='아이디'], #id").first
        id_input.fill(NAVER_ID)
        time.sleep(0.5)
        pw_input = page.locator("input[type='password']").first
        pw_input.fill(NAVER_PW)
        time.sleep(0.5)
        # Enter 키로 로그인 폼 제출 (가장 안정적인 방법)
        pw_input.press("Enter")
        time.sleep(3)

        # 캡챠/추가인증 감지 및 사용자 대기 (최대 3분)
        max_wait = 180
        waited = 0
        captcha_notified = False
        while waited < max_wait:
            current_url = page.url
            # 로그인 완료: nid.naver.com을 완전히 벗어나면 성공
            if "nid.naver.com" not in current_url:
                break
            # 캡챠 또는 추가 인증 페이지 안내 (한 번만)
            if not captcha_notified:
                captcha_visible = page.locator("text=보안을 위해 추가 확인").count() > 0
                if captcha_visible:
                    print("\n[주의] 캡챠(보안 문자)가 나타났습니다!")
                    print("  >> 열린 브라우저 창에서 직접 문제를 풀어주세요!")
                    print("  >> 풀고 나면 자동으로 계속 진행됩니다... (최대 3분 대기)")
                    captcha_notified = True
            time.sleep(2)
            waited += 2

        page.wait_for_load_state("networkidle")
        time.sleep(2)

        # 최종 로그인 결과 확인
        current_url = page.url
        if "nid.naver.com" in current_url and "nidlogin.login" in current_url and waited >= max_wait:
            print("[오류] 시간 초과! 캡챠를 제때 풀지 못했거나 로그인에 실패했습니다.")
            page.screenshot(path=str(Path(__file__).parent / "error_screenshot.png"))
            browser.close()
            sys.exit(1)

        print("[완료] 로그인 성공!")

        # 2. 블로그 글쓰기 페이지 이동
        print("\n[2단계] 글쓰기 페이지 이동 중...")
        page.goto("https://blog.naver.com/blallnationsch/postwrite")
        page.wait_for_load_state("networkidle")
        time.sleep(3)

        # 3. 제목 입력
        print("[3단계] 제목 입력 중...")
        title_input = page.locator(".se-title-input").first
        title_input.click()
        title_input.type(title, delay=50)
        time.sleep(1)

        # 4. 본문 입력
        print("[4단계] 본문 입력 중...")
        content_area = page.locator(".se-content").first
        content_area.click()
        time.sleep(0.5)
        
        paragraphs = content.split("\n")
        for i, para in enumerate(paragraphs):
            if para.strip():
                content_area.type(para, delay=20)
            if i < len(paragraphs) - 1:
                page.keyboard.press("Enter")
        
        time.sleep(1)

        # 5. 발행 버튼 클릭
        print("\n[5단계] 발행 중...")
        publish_btn = page.locator("button:has-text('발행')").first
        publish_btn.click()
        time.sleep(2)

        try:
            confirm_btn = page.locator(".btn_confirm, button:has-text('확인')").first
            confirm_btn.click()
            time.sleep(3)
        except:
            pass

        print("\n[완료] 포스팅 완료!")
        print(f"  블로그: https://blog.naver.com/blallnationsch")
        time.sleep(2)

    except Exception as e:
        print(f"\n[오류] 오류 발생: {e}")
        page.screenshot(path=str(Path(__file__).parent / "error_screenshot.png"))
        print("  오류 화면을 error_screenshot.png 에 저장했습니다.")

    finally:
        browser.close()
