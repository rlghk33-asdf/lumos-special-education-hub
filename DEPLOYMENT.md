# 배포 및 등록 기록

확인일: 2026-11-07 (Asia/Seoul)

- 공개 사이트: https://rlghk33-asdf.github.io/lumos-special-education-hub/
- GitHub: https://github.com/rlghk33-asdf/lumos-special-education-hub
- Firebase: `lumos-teacher-hub-rlghk33`, 웹 앱 `1:470508709363:web:66b20f56a1e16fdbd7de86`
- Firestore: `(default)`, Standard, `asia-northeast3`, 무료 사용 구간. 유료 결제 계정 연결 안 함.
- 인증: Google 제공자 활성화, GitHub Pages 호스트 허용. 지원 이메일은 공개 소스에 넣지 않고 Firebase에 설정.
- 배포: `main` push 시 GitHub Actions가 Node 테스트·정적 빌드 후 Pages에 배포.
- 보안 테스트: Node 7건, Firestore emulator 5건 통과. 공개 사이트의 실제 Google 로그인·저장·수정·재조회·내보내기·로그아웃 확인.

## 교사의 별자리 신청

공개 HTTP 등록 클라이언트 두 파일을 프로젝트 밖 임시 폴더에 내려받아 검토하고 실행했습니다. 공개 이름·소개·실제 배포 주소·분류·문양만 제출했습니다.

- 접수 번호: `8df2b304-c58d-4b6b-9c55-dcaf265acec9`
- 결과: 프로세스 종료 코드 0, `state: queued` (접수 완료, 게시 자동 처리 대기)
- 추적: https://github.com/Taehwan-Shin/teacher-hub/issues?q=is%3Aissue%20%22%EC%A0%91%EC%88%98%208df2b304-c58d-4b6b-9c55-dcaf265acec9%22

동일 주소를 다시 신청하지 마세요. 실제 카드 게시·Issue 생성은 운영 측 주기 작업에 따라 지연될 수 있습니다.
