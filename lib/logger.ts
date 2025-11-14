// 로그 수집 유틸리티
// 애플리케이션에서 발생하는 에러를 자동으로 수집하여 서버로 전송

interface LogEntry {
  type: "error" | "warning" | "info" | "debug";
  message: string;
  errorCode?: string;
  responseTime?: number;
  details?: string;
  file?: string;
  timestamp?: string;
  level?: string;
  stack?: string;
}

class Logger {
  private apiEndpoint: string;
  private enabled: boolean;
  private batchSize: number;
  private batchTimeout: number;
  private logQueue: LogEntry[];

  constructor() {
    // API 엔드포인트 설정
    this.apiEndpoint = typeof window !== "undefined" 
      ? `${window.location.origin}/api/logs/collect`
      : "/api/logs/collect";
    
    // 로그 수집 활성화 여부 (환경 변수 또는 localStorage로 제어 가능)
    this.enabled = true;
    
    // 배치 처리 설정
    this.batchSize = 10; // 10개씩 배치 전송
    this.batchTimeout = 5000; // 5초마다 전송
    this.logQueue = [];

    // 브라우저 환경에서만 배치 전송 시작
    if (typeof window !== "undefined") {
      this.startBatchProcessor();
      this.setupGlobalErrorHandlers();
    }
  }

  // 배치 전송 시작
  private startBatchProcessor() {
    setInterval(() => {
      this.flushBatch();
    }, this.batchTimeout);
  }

  // 배치 전송 실행
  private async flushBatch() {
    if (this.logQueue.length === 0) return;

    const logsToSend = this.logQueue.splice(0, this.batchSize);
    
    try {
      await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logsToSend),
      });
    } catch (error) {
      console.error("로그 전송 실패:", error);
      // 전송 실패 시 큐에 다시 추가 (무한 루프 방지를 위해 제한)
      if (logsToSend.length < 100) {
        this.logQueue.unshift(...logsToSend);
      }
    }
  }

  // 전역 에러 핸들러 설정
  private setupGlobalErrorHandlers() {
    // JavaScript 에러 캐치
    window.addEventListener("error", (event) => {
      this.error({
        message: event.message || "Unknown error",
        file: event.filename,
        details: `${event.lineno}:${event.colno}`,
        stack: event.error?.stack,
      });
    });

    // Promise rejection 캐치
    window.addEventListener("unhandledrejection", (event) => {
      this.error({
        message: event.reason?.message || "Unhandled promise rejection",
        details: String(event.reason),
        stack: event.reason?.stack,
      });
    });

    // Fetch 에러 인터셉터
    this.interceptFetch();
  }

  // Fetch 요청 인터셉터
  private interceptFetch() {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = async function (...args) {
      const startTime = Date.now();
      const url = typeof args[0] === "string" ? args[0] : args[0].url;

      try {
        const response = await originalFetch.apply(this, args);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // 에러 응답 (4xx, 5xx) 로그 수집
        if (!response.ok) {
          const errorCode = response.status.toString();
          const errorText = await response.clone().text().catch(() => "");
          const status = response.status;

          // 5xx 서버 에러는 error로, 4xx 클라이언트 에러는 error로 처리
          // (4xx도 에러이므로 모두 error로 처리)
          if (status >= 400) {
            self.error({
              message: `API Error: ${status} ${response.statusText} - ${url}`,
              errorCode,
              responseTime,
              details: errorText.substring(0, 500), // 처음 500자만
            });
          } else {
            // 3xx 등은 warning으로 처리
            self.warning({
              message: `API Warning: ${status} ${response.statusText} - ${url}`,
              errorCode,
              responseTime,
              details: errorText.substring(0, 500),
            });
          }
        } else if (responseTime > 1000) {
          // 느린 응답 경고 (1초 이상)
          self.warning({
            message: `Slow API Response: ${url}`,
            responseTime,
            details: `Response took ${responseTime}ms`,
          });
        }

        return response;
      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // 네트워크 에러
        self.error({
          message: `Network Error: ${error instanceof Error ? error.message : String(error)}`,
          details: `URL: ${url}`,
          responseTime,
          stack: error instanceof Error ? error.stack : undefined,
        });

        throw error;
      }
    };
  }

  // 에러 로그
  error(entry: Omit<LogEntry, "type">) {
    if (!this.enabled) return;

    const logEntry: LogEntry = {
      type: "error",
      message: entry.message,
      errorCode: entry.errorCode,
      responseTime: entry.responseTime,
      details: entry.details,
      file: entry.file,
      timestamp: new Date().toISOString(),
      level: "ERROR",
      stack: entry.stack,
    };

    this.logQueue.push(logEntry);
    this.flushIfNeeded();
  }

  // 경고 로그
  warning(entry: Omit<LogEntry, "type">) {
    if (!this.enabled) return;

    const logEntry: LogEntry = {
      type: "warning",
      message: entry.message,
      errorCode: entry.errorCode,
      responseTime: entry.responseTime,
      details: entry.details,
      file: entry.file,
      timestamp: new Date().toISOString(),
      level: "WARNING",
    };

    this.logQueue.push(logEntry);
    this.flushIfNeeded();
  }

  // 정보 로그
  info(entry: Omit<LogEntry, "type">) {
    if (!this.enabled) return;

    const logEntry: LogEntry = {
      type: "info",
      message: entry.message,
      errorCode: entry.errorCode,
      responseTime: entry.responseTime,
      details: entry.details,
      file: entry.file,
      timestamp: new Date().toISOString(),
      level: "INFO",
    };

    this.logQueue.push(logEntry);
    this.flushIfNeeded();
  }

  // 디버그 로그
  debug(entry: Omit<LogEntry, "type">) {
    if (!this.enabled) return;

    const logEntry: LogEntry = {
      type: "debug",
      message: entry.message,
      errorCode: entry.errorCode,
      responseTime: entry.responseTime,
      details: entry.details,
      file: entry.file,
      timestamp: new Date().toISOString(),
      level: "DEBUG",
    };

    this.logQueue.push(logEntry);
    this.flushIfNeeded();
  }

  // 즉시 전송 (배치 대기 없이)
  async sendImmediate(entry: Omit<LogEntry, "type">, type: "error" | "warning" | "info" | "debug" = "error") {
    if (!this.enabled) return;

    const logEntry: LogEntry = {
      type,
      message: entry.message,
      errorCode: entry.errorCode,
      responseTime: entry.responseTime,
      details: entry.details,
      file: entry.file,
      timestamp: new Date().toISOString(),
      level: type.toUpperCase(),
      stack: entry.stack,
    };

    try {
      await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([logEntry]),
      });
    } catch (error) {
      console.error("즉시 로그 전송 실패:", error);
      // 전송 실패 시 큐에 추가
      this.logQueue.push(logEntry);
    }
  }

  // 필요 시 즉시 전송 (배치 크기 초과 시)
  private flushIfNeeded() {
    if (this.logQueue.length >= this.batchSize) {
      this.flushBatch();
    }
  }

  // 로그 수집 활성화/비활성화
  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  // 수동으로 큐 비우기
  async flush() {
    await this.flushBatch();
  }
}

// 싱글톤 인스턴스
export const logger = typeof window !== "undefined" ? new Logger() : null;

// 편의 함수
export const logError = (message: string, error?: Error | unknown) => {
  if (!logger) return;

  if (error instanceof Error) {
    logger.error({
      message,
      details: error.message,
      stack: error.stack,
    });
  } else {
    logger.error({
      message,
      details: String(error),
    });
  }
};

export const logWarning = (message: string, details?: string) => {
  if (!logger) return;
  logger.warning({ message, details });
};

export const logInfo = (message: string, details?: string) => {
  if (!logger) return;
  logger.info({ message, details });
};

export const logDebug = (message: string, details?: string) => {
  if (!logger) return;
  logger.debug({ message, details });
};

