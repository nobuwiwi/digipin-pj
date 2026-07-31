# 開発用ビルド（Development Build）手順

Expo Goではなく、専用の開発用アプリをビルドしてiPhone Xで検証する手順です。

## 前提条件

- Apple Developerアカウント（年額99ドル）
- Node.js LTS がインストールされたパソコン
- EAS CLI

## 1. EAS CLIをインストール

```bash
npm install -g eas-cli
```

## 2. Expoアカウントにログイン

```bash
eas login
```

## 3. 依存パッケージをインストール

```bash
cd mobile
npm install
```

## 4. EASを初期化（初回のみ）

```bash
eas init
```

## 5. 開発用ビルドを作成

```bash
eas build --profile development --platform ios
```

ビルドが完了すると、TestFlight経由でインストールするためのリンクがメールで届きます。

## 6. iPhone Xにインストール

1. 届いたメールのリンクからTestFlightを開く
2. 開発用アプリをインストール
3. アプリを起動すると、Metro bundlerのURL入力画面が表示される

## 7. Metro bundlerを起動

パソコンで以下を実行:

```bash
cd mobile
npx expo start --tunnel
```

表示されたURLをiPhone Xの開発用アプリに入力すると、アプリが読み込まれます。

## 注意点

- 開発用ビルドはExpo Goの代わりとなる専用アプリです
- SDK 57に対応しているため、iPhone X（iOS 16.4以上）で動作します
- ビルドには約20〜40分かかります
- コードを変更するたびに再ビルド不要、Metroの再読み込みで反映されます
