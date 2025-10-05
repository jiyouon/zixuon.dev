// 앱 설정 상수들
const CONFIG = {
  // 타이밍 설정
  INITIAL_COUNTDOWN: 5, // 초기 카운트다운 (초)
  SHOT_INTERVAL: 5000, // 촬영 간격 (밀리초)
  NEXT_SHOT_COUNTDOWN: 5, // 다음 촬영까지 카운트다운 (초)
  FLASH_DURATION: 150, // 플래시 효과 지속시간 (밀리초)
  LOADING_DELAY: 1500, // 로딩 화면 지속시간 (밀리초)
  FINAL_LOADING_DELAY: 2000, // 최종 처리 로딩 시간 (밀리초)

  // 촬영 설정
  TOTAL_SHOTS: 8, // 총 촬영 장수
  SELECT_COUNT: 4, // 선택할 사진 장수

  // 카메라 설정
  VIDEO_WIDTH: 1280,
  VIDEO_HEIGHT: 720,
  IMAGE_QUALITY: 0.8, // JPEG 품질 (0.0 ~ 1.0)

  // 마스크 위치 (4컷 레이아웃에서 각 사진의 위치)
  MASK_POSITIONS: [
    { x: 110.7, y: 394 }, // mask-1   
    { x: 110.7, y: 1612.6 }, // mask-2
    { x: 110.7, y: 2830.5 }, // mask-3
    { x: 110.7, y: 4050.5 }, // mask-4 
  ]
};

class FourCutApp {
  constructor() {
    this.currentScreen = "start";
    this.stream = null;
    this.capturedPhotos = [];
    this.selectedPhotos = [];
    this.shotCount = 0;
    this.countdownInterval = null;
    this.shootingInterval = null;

    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // 시작 버튼
    document.getElementById("start-btn").addEventListener("click", async () => {
      await this.requestCameraPermission();
      this.startCountdown();
    });

    // 확인 버튼
    document.getElementById("confirm-btn").addEventListener("click", () => {
      this.processSelectedPhotos();
    });

    // 다시 찍기 버튼
    document.getElementById("retake-btn").addEventListener("click", () => {
      this.resetApp();
    });

    // 처음부터 버튼
    document.getElementById("restart-btn").addEventListener("click", () => {
      this.resetApp();
    });
  }

  // 카메라 권한 요청
  async requestCameraPermission() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: CONFIG.VIDEO_WIDTH, height: CONFIG.VIDEO_HEIGHT },
        audio: false,
      });
      this.setupCamera();
    } catch (error) {
      console.error("카메라 접근 오류:", error);
      alert("카메라에 접근할 수 없습니다. 권한을 확인해주세요.");
    }
  }

  setupCamera() {
    const videos = [
      document.getElementById("camera-preview-countdown"),
      document.getElementById("camera-preview-shooting"),
    ];

    videos.forEach((video) => {
      if (video) {
        video.srcObject = this.stream;
      }
    });
  }

  // 화면 전환
  switchScreen(screenId) {
    // 모든 화면 숨기기
    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.remove("active");
    });

    // 새 화면 보이기
    document.getElementById(screenId).classList.add("active");
    this.currentScreen = screenId;
  }

  // 로딩 화면 표시하기
  showLoading(message = "처리중 ...") {
    document.getElementById("loading-message").textContent = message;
    document.getElementById("loading-overlay").classList.add("active");
  }

  hideLoading() {
    document.getElementById("loading-overlay").classList.remove("active");
  }

  // 카운트다운 시작
  startCountdown() {
    this.switchScreen("countdown-screen");

    let count = CONFIG.INITIAL_COUNTDOWN;
    const countdownElement = document.getElementById("countdown-number");

    countdownElement.textContent = count; // 시작 숫자 먼저 표시

    this.countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        countdownElement.textContent = count;
      } else {
        clearInterval(this.countdownInterval);
        countdownElement.textContent = ""; // 0일 때 숫자 숨김
        this.startShooting();
      }
    }, 1000);
  }

  // 촬영 시작
  startShooting() {
    this.switchScreen("shooting-screen");
    this.shotCount = 0;
    this.capturedPhotos = [];

    // 첫 번째 사진 촬영
    this.takePhoto();

    // 설정된 간격마다 촬영
    this.shootingInterval = setInterval(() => {
      if (this.shotCount < CONFIG.TOTAL_SHOTS) {
        this.takePhoto();
      } else {
        clearInterval(this.shootingInterval);
        this.finishShooting();
      }
    }, CONFIG.SHOT_INTERVAL);

    // 다음 촬영까지 카운트다운
    this.startNextShotCountdown();
  }

  // 다음 촬영까지 카운트다운
  startNextShotCountdown() {
    let nextShotCount = CONFIG.NEXT_SHOT_COUNTDOWN;
    const countdownElement = document.getElementById("next-shot-countdown");

    countdownElement.textContent = nextShotCount; // 시작 숫자 먼저 표시

    const nextCountInterval = setInterval(() => {
      nextShotCount--;
      if (nextShotCount > 0) {
        countdownElement.textContent = nextShotCount;
      } else {
        clearInterval(nextCountInterval);
        countdownElement.textContent = ""; // 0일 때 숫자 숨김
        if (this.shotCount < CONFIG.TOTAL_SHOTS) {
          this.startNextShotCountdown();
        }
      }
    }, 1000);
  }

  // 사진 촬영
  takePhoto() {
    this.shotCount++;

    // 촬영 횟수 업데이트
    document.getElementById(
      "shot-counter"
    ).textContent = `${this.shotCount} / ${CONFIG.TOTAL_SHOTS}`;

    // 플래시 효과
    this.showFlash();

    // 사진 캡처 (비디오 프레임을 canvas로 복사해서 데이터 얻기)
    this.captureFromVideo();

    // 마지막 촬영인 경우 바로 완료 처리
    if (this.shotCount >= CONFIG.TOTAL_SHOTS) {
      clearInterval(this.shootingInterval);
      this.finishShooting();
    }
  }

  // 플래시 효과
  showFlash() {
    const flash = document.getElementById("flash");
    flash.classList.add("active");
    setTimeout(() => {
      flash.classList.remove("active");
    }, CONFIG.FLASH_DURATION);
  }

  // 비디오에서 사진 캡처
  captureFromVideo() {
    const video = document.getElementById("camera-preview-shooting");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 거울모드로 캡처 (좌우 반전)
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0);

    const imageDataURL = canvas.toDataURL("image/jpeg", CONFIG.IMAGE_QUALITY);
    this.capturedPhotos.push(imageDataURL);
  }

  // 촬영 완료
  finishShooting() {
    this.showLoading("사진을 처리중 ...");
    
    // 카메라 스트림 정리
    if (this.stream) {
    this.stream.getTracks().forEach(track => track.stop());
    this.stream = null;
  }

    setTimeout(() => {
      this.hideLoading();
      this.setupPhotoSelection();
      this.switchScreen("selection-screen");
    }, CONFIG.LOADING_DELAY);
  }

  // 사진 선택 화면 설정
  setupPhotoSelection() {
    const photoGrid = document.getElementById("photo-grid");
    photoGrid.innerHTML = "";

    this.capturedPhotos.forEach((photo, index) => {
      const photoElement = document.createElement("div");
      photoElement.className = "photo-item";
      photoElement.dataset.index = index;

      const img = document.createElement("img");
      img.src = photo;

      photoElement.appendChild(img);
      photoElement.addEventListener("click", () =>
        this.togglePhotoSelection(index)
      );

      photoGrid.appendChild(photoElement);
    });

    // 선택 상태 초기화
    this.selectedPhotos = [];
    this.updateSelectionUI();
    this.updatePreviewCanvas();
  }

  // 사진 선택/해제 토글
  togglePhotoSelection(index) {
    const photoElement = document.querySelector(
      `.photo-item[data-index="${index}"]`
    );

    if (this.selectedPhotos.includes(index)) {
      // 선택 해제
      this.selectedPhotos = this.selectedPhotos.filter((i) => i !== index);
      photoElement.classList.remove("selected");
    } else {
      // 선택 추가 (최대 CONFIG.SELECT_COUNT개)
      if (this.selectedPhotos.length < CONFIG.SELECT_COUNT) {
        this.selectedPhotos.push(index);
        photoElement.classList.add("selected");
      }
    }

    this.updateSelectionUI();
    this.updatePreviewCanvas();
  }

  // 선택 UI 업데이트
  updateSelectionUI() {
    // 4컷 프레임에 선택된 사진 표시
    const slots = document.querySelectorAll(".fourcut-slot");

    slots.forEach((slot, index) => {
      const img = slot.querySelector("img");
      if (img) img.remove();

      if (this.selectedPhotos[index] !== undefined) {
        const selectedIndex = this.selectedPhotos[index];
        const newImg = document.createElement("img");
        newImg.src = this.capturedPhotos[selectedIndex];
        slot.appendChild(newImg);
        slot.classList.add("filled");
      } else {
        slot.classList.remove("filled");
      }
    });

    // 모든 사진 요소의 선택 번호 업데이트
    document.querySelectorAll(".photo-item").forEach((photoElement) => {
      const badge = photoElement.querySelector(".selection-badge");
      if (badge) badge.remove();
    });

    // 선택된 사진들에 새로운 번호 부여
    this.selectedPhotos.forEach((photoIndex, order) => {
      const photoElement = document.querySelector(
        `.photo-item[data-index="${photoIndex}"]`
      );
      if (photoElement) {
        const badge = document.createElement("div");
        badge.className = "selection-badge";
        badge.textContent = order + 1;
        photoElement.appendChild(badge);
      }
    });

    // 선택 개수 업데이트
    document.getElementById(
      "selection-count"
    ).textContent = `${this.selectedPhotos.length} / ${CONFIG.SELECT_COUNT} 선택됨`;

    // 확인 버튼 활성화/비활성화
    const confirmBtn = document.getElementById("confirm-btn");
    confirmBtn.disabled = this.selectedPhotos.length !== CONFIG.SELECT_COUNT;
  }

  // 실시간 미리보기 캔버스 업데이트
  updatePreviewCanvas() {
    const canvas = document.getElementById("preview-canvas");
    const ctx = canvas.getContext("2d");

    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 레이아웃 이미지 로드
    const layoutImg = new Image();
    layoutImg.onload = () => {
      // 캔버스를 레이아웃 크기에 맞게 조정
      const scale = Math.min(
        canvas.width / layoutImg.width,
        canvas.height / layoutImg.height
      );
      const scaledWidth = layoutImg.width * scale;
      const scaledHeight = layoutImg.height * scale;
      const offsetX = (canvas.width - scaledWidth) / 2;
      const offsetY = (canvas.height - scaledHeight) / 2;

      // 레이아웃 이미지를 배경으로 그리기
      ctx.drawImage(layoutImg, offsetX, offsetY, scaledWidth, scaledHeight);

      // 선택된 사진들을 마스크로 합성
      if (this.selectedPhotos.length > 0) {
        this.compositePreviewWithMasks(ctx, offsetX, offsetY, scale);
      }
    };
    layoutImg.src = "assets/images/layout.png";
  }

  // 미리보기용 마스크 합성
  async compositePreviewWithMasks(ctx, offsetX, offsetY, scale) {
    const maskPositions = CONFIG.MASK_POSITIONS;

    for (let i = 0; i < this.selectedPhotos.length && i < CONFIG.SELECT_COUNT; i++) {
      const photoIndex = this.selectedPhotos[i];
      const position = {
        x: offsetX + maskPositions[i].x * scale,
        y: offsetY + maskPositions[i].y * scale,
      };

      await this.compositePreviewImageWithMask(
        ctx,
        this.capturedPhotos[photoIndex],
        `assets/images/mask-${i + 1}.png`,
        position,
        scale
      );
    }
  }

  // 미리보기용 개별 이미지 마스크 합성
  compositePreviewImageWithMask(ctx, photoData, maskPath, position, scale) {
    return new Promise((resolve) => {
      const maskImg = new Image();
      maskImg.onload = () => {
        const photoImg = new Image();
        photoImg.onload = () => {
          // 임시 캔버스 생성
          const tempCanvas = document.createElement("canvas");
          const tempCtx = tempCanvas.getContext("2d");

          const scaledMaskWidth = maskImg.width * scale;
          const scaledMaskHeight = maskImg.height * scale;

          tempCanvas.width = scaledMaskWidth;
          tempCanvas.height = scaledMaskHeight;

          // 사진을 마스크 크기에 맞게 리사이즈하여 그리기
          const imgScale = Math.max(
            scaledMaskWidth / photoImg.width,
            scaledMaskHeight / photoImg.height
          );
          const scaledWidth = photoImg.width * imgScale;
          const scaledHeight = photoImg.height * imgScale;
          const imgOffsetX = (scaledMaskWidth - scaledWidth) / 2;
          const imgOffsetY = (scaledMaskHeight - scaledHeight) / 2;

          tempCtx.drawImage(
            photoImg,
            imgOffsetX,
            imgOffsetY,
            scaledWidth,
            scaledHeight
          );

          // 마스크 적용 (destination-in 컴포지트 모드 사용)
          tempCtx.globalCompositeOperation = "destination-in";
          tempCtx.drawImage(maskImg, 0, 0, scaledMaskWidth, scaledMaskHeight);

          // 메인 캔버스에 합성된 이미지 그리기
          ctx.drawImage(tempCanvas, position.x, position.y);

          resolve();
        };
        photoImg.src = photoData;
      };
      maskImg.src = maskPath;
    });
  }

  // 선택된 사진들 처리
  processSelectedPhotos() {
    this.showLoading("4컷 사진을 생성중 ...");

    setTimeout(() => {
      this.createFinalImage();
      this.hideLoading();
      this.switchScreen("result-screen");
    }, CONFIG.FINAL_LOADING_DELAY);
  }

  // 최종 4컷 사진 생성
  createFinalImage() {
    const canvas = document.getElementById("final-canvas");
    const ctx = canvas.getContext("2d");

    // 레이아웃 이미지 로드
    const layoutImg = new Image();
    layoutImg.onload = () => {
      canvas.width = layoutImg.width;
      canvas.height = layoutImg.height;

      // 레이아웃 이미지를 배경으로 그리기
      ctx.drawImage(layoutImg, 0, 0);

      // 마스크 기반으로 이미지 합성
      this.compositeWithMasks(ctx);
    };
    layoutImg.src = "assets/images/layout.png";
  }

  // 마스크를 사용하여 이미지 합성
  async compositeWithMasks(ctx) {
    const maskPositions = CONFIG.MASK_POSITIONS;

    let processedCount = 0;

    for (let i = 0; i < this.selectedPhotos.length && i < CONFIG.SELECT_COUNT; i++) {
      const photoIndex = this.selectedPhotos[i];
      const position = maskPositions[i];

      await this.compositeImageWithMask(
        ctx,
        this.capturedPhotos[photoIndex],
        `assets/images/mask-${i + 1}.png`,
        position
      );

      processedCount++;
      if (processedCount === this.selectedPhotos.length) {
        this.saveImageToDesktop(document.getElementById("final-canvas"));
      }
    }
  }

  // 개별 이미지를 마스크로 합성
  compositeImageWithMask(ctx, photoData, maskPath, position) {
    return new Promise((resolve) => {
      const maskImg = new Image();
      maskImg.onload = () => {
        const photoImg = new Image();
        photoImg.onload = () => {
          // 임시 캔버스 생성
          const tempCanvas = document.createElement("canvas");
          const tempCtx = tempCanvas.getContext("2d");

          tempCanvas.width = maskImg.width;
          tempCanvas.height = maskImg.height;

          // 사진을 마스크 크기에 맞게 리사이즈하여 그리기
          const scale = Math.max(
            maskImg.width / photoImg.width,
            maskImg.height / photoImg.height
          );
          const scaledWidth = photoImg.width * scale;
          const scaledHeight = photoImg.height * scale;
          const offsetX = (maskImg.width - scaledWidth) / 2;
          const offsetY = (maskImg.height - scaledHeight) / 2;

          tempCtx.drawImage(
            photoImg,
            offsetX,
            offsetY,
            scaledWidth,
            scaledHeight
          );

          // 마스크 적용 (destination-in 컴포지트 모드 사용)
          tempCtx.globalCompositeOperation = "destination-in";
          tempCtx.drawImage(maskImg, 0, 0);

          // 메인 캔버스에 합성된 이미지 그리기
          ctx.drawImage(tempCanvas, position.x, position.y);

          resolve();
        };
        photoImg.src = photoData;
      };
      maskImg.src = maskPath;
    });
  }

  // 바탕화면에 이미지 저장
  async saveImageToDesktop(canvas) {
    try {
      // Canvas를 PNG 데이터 URL로 변환
      const imageData = canvas.toDataURL("image/png");

      // Electron API를 통해 바탕화면에 저장
      const result = await window.electronAPI.saveImage(imageData);

      if (result.success) {
        document.getElementById(
          "save-message"
        ).textContent = `4컷 사진이 바탕화면에 저장되었습니다!`;
        console.log("저장된 파일 경로:", result.filePath);
      } else {
        document.getElementById(
          "save-message"
        ).textContent = `저장 실패: ${result.error}`;
        console.error("저장 실패:", result.error);
      }
    } catch (error) {
      document.getElementById("save-message").textContent =
        "이미지 저장 중 오류가 발생했습니다.";
      console.error("이미지 저장 오류:", error);
    }
  }

  // 앱 초기화
  resetApp() {
    // 타이머 정리
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.shootingInterval) clearInterval(this.shootingInterval);


    // 카메라 스트림 정리
    if (this.stream) {
    this.stream.getTracks().forEach(track => track.stop());
    this.stream = null;
  }

    // 데이터 초기화
    this.capturedPhotos = [];
    this.selectedPhotos = [];
    this.shotCount = 0;

    // 시작 화면으로 돌아가기
    this.switchScreen("start-screen");
  }
}

// 앱 시작
document.addEventListener("DOMContentLoaded", () => {
  new FourCutApp();
});
