# Stage 1: Build
FROM golang:alpine AS builder

RUN apk add --no-cache git

WORKDIR /app
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY . .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    mkdir -p /app/build_tmp && TMPDIR=/app/build_tmp CGO_ENABLED=0 GOOS=linux go build -o server ./main.go

# Stage 2: Run
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=builder /app/server .

RUN mkdir -p uploads

EXPOSE 8080
CMD ["./server"]