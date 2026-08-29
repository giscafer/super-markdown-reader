# Super MD Reader

<img alt="Super MD Reader Logo" src="https://raw.githubusercontent.com/giscafer/super-markdown-reader/main/src/images/logo-stroke.svg" align="right" width="120">

[English](./README.md) | [中文](./README-cn.md) | 한국어

https://markdown.giscafer.com

**Super MD Reader** 는 브라우저에서 마크다운 문서를 미리 볼 수 있게 해주는 브라우저 확장 프로그램입니다.

- **문서 형식**: `file://`, `http://`, `https://` 프로토콜과 `.md`, `.mkd`, `.mdx`, `.markdown` 확장자 파일 미리보기 지원:
  - `https://example.com/example.md` (온라인 Markdown URL)
  - `file:///Users/my-project/readme.markdown` (로컬 마크다운 파일, \*[특정 권한 필요](#파일-액세스-권한-허용))
- **구문 플러그인**: 이모지, 위첨자/아래첨자, 체크박스, 수식, 흐름도, 간트 차트, 목차, 인서션, 약어, 주석, 알림 등의 기능 제공.
- **테마**: 고품질 라이트와 다크 테마, 코드 강조 기능 지원.
- **실시간 리로딩**: 실시간 문서 변경과 더 나은 읽기 경험을 위한 중앙 표시 기능.
- **문서 구성**: 사이드바 디렉토리, 원본 콘텐츠 미리보기, 이미지 미디어 지원 기능 포함.
- **단축키**: 웹 확장 프로그램 단축키를 통한 빠른 기능 실행 지원.

![banner](./example/example-1.png)

기본 테마 형식은 https://github.com/md-reader/theme 에 저장된다.테마 스타일을 보거나 사용자 정의할 경우,이 링크에 접근하여 css 파일을 조정할 수 있다.

## 설치

### A. 웹 확장 스토어에서 설치

<img src="./src/images/Chrome.png" alt="Chrome" style="width:50px"/>
<img src="./src/images/Edge.png" alt="Edge" style="width:50px"/>
<img src="./src/images/Firefox.png" alt="Firefox" style="width:50px"/>
<img src="./src/images/Arc.png" alt="Arc" style="width:50px"/>

### B. 빌드 설치

Chrome의 예:

1. 이 저장소를 복제하고 빌드하세요:

   ```bash
   # 이 저장소를 복제합니다
   git clone https://github.com/giscafer/super-markdown-reader.git && cd super-markdown-reader

   # 의존성을 설치합니다
   pnpm install

   # 확장 프로그램을 빌드합니다
   pnpm build
   ```

2. 빌드가 성공적으로 완료되면 압축하지 않은 확장 프로그램이 `dist/md-reader` 에 생성됩니다.

3. `chrome://extensions` 에서 **개발자 모드**를 켠 뒤 **압축해제된 확장 프로그램을 로드합니다**를 누르고 `dist/md-reader` 폴더를 선택하세요. 처음 한 번만 하면 됩니다. 이후 `pnpm build` 또는 `pnpm dev` 는 같은 폴더를 갱신합니다. 개발 중에는 `pnpm dev` 를 쓰면 확장이 자동으로 다시 로드됩니다.

   스토어 업로드가 필요하면 `pnpm zip` 으로 `dist/md-reader-x.y.z.zip` 을 만들 수 있습니다.

## 사용법

Chrome의 예:

설치 후에는 Chrome에서 온라인 마크다운 문서를 미리 볼 수 있습니다. 그러나 Chrome은 기본적으로 로컬 마크다운 문서를 미리 볼 수 없으며 Chrome 확장 프로그램에 대한 파일 액세스 권한을 활성화해야 합니다.

### 파일 액세스 권한 허용

> 보안상의 이유로 Chrome은 기본적으로 로컬 파일에 대한 확장 프로그램 액세스를 비활성화합니다. 따라서 플러그인을 설치한 후 로컬 마크다운 파일을 미리 보려면 권한을 수동으로 활성화해야 합니다.

Chrome 확장 프로그램 관리 페이지에서 설치한 "Super MD Reader" 확장 프로그램을 찾아 "상세정보"를 클릭하고 "파일 URL에 대한 액세스 허용" 옵션을 찾으세요. 세부 정보 페이지에서 이를 활성 상태로 전환하세요 ("Super MD Reader"는 마크다운 파일에 대해 읽기 및 표시 작업만 수행하며 사용자 파일 데이터를 수정하거나 업로드하지 않음을 안심하셔도 됩니다).

<br/>

이제 모든 작업이 완료되었습니다~! ヾ(◍°∇°◍)ﾉ

이 온라인 문서를 열어 효과를 확인해보세요: [예시 문서](https://raw.githubusercontent.com/giscafer/super-markdown-reader/main/example/example.md); 또한 마크다운 문서를 브라우저로 직접 드래그하여 시도해볼 수도 있습니다!

질문이나 제안이 있으면 언제든지 말씀해주세요.

## 라이선스

라이선스 [MIT](./LICENSE)
