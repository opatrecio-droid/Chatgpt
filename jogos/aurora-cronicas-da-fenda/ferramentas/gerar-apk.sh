#!/usr/bin/env bash
# Gera o APK assinado: monta o HTML, sincroniza o Capacitor e compila com o Gradle.
# Pré-requisitos: Node 22+, JDK 21 e o Android SDK (cmdline-tools + platform android-36 + build-tools).
#   export ANDROID_HOME=/caminho/do/android-sdk      (padrão: /opt/android-sdk)
# Assinatura: assinatura/keystore.properties (fora do git) ou variáveis AURORA_KEYSTORE*, ver android/app/build.gradle.
# Sem chave, o APK sai assinado com a chave de debug (instala igual, mas não atualiza por cima de outro APK).
set -euo pipefail
cd "$(dirname "$0")/.."

export ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-/opt/android-sdk}}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
[ -d "$ANDROID_HOME/platforms" ] || { echo "Android SDK não encontrado em $ANDROID_HOME (veja README)"; exit 1; }
[ -d node_modules ] || npm ci

node ferramentas/montar.mjs
npx cap sync android
( cd android && ./gradlew --no-daemon -q assembleRelease )

SAIDA=apk/aurora-cronicas-da-fenda-v$(node -p "require('./package.json').version")-android.apk
mkdir -p apk
cp android/app/build/outputs/apk/release/app-release.apk "$SAIDA"
echo "APK: $SAIDA"
sha256sum "$SAIDA"
BT=$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)
"$BT/apksigner" verify --print-certs "$SAIDA" | head -3
