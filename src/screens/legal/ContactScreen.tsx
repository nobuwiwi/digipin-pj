import React from 'react';
import { ArrowLeft, Mail, MessageSquare, HelpCircle, CheckCircle } from 'lucide-react';

const ContactScreen: React.FC = () => {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-forest-50/50 flex flex-col text-gray-800">
      <header className="bg-white border-b border-forest-100 px-4 py-3 sticky top-0 z-10 flex items-center shadow-sm">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-forest-50 text-forest-800 transition-colors"
          aria-label="戻る"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="ml-2 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-forest-700" />
          <h1 className="text-base font-bold text-gray-900">お問い合わせ</h1>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-forest-100 p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-forest-900 mb-2">
              サポート・お問い合わせ窓口
            </h2>
            <p className="text-sm text-gray-600">
              デジピンに関するご質問、不具合の報告、ご要望などは以下のメール窓口よりお気軽にお問い合わせください。
            </p>
          </div>

          <div className="bg-forest-50/60 rounded-xl p-5 border border-forest-100 flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl shadow-xs border border-forest-100 text-forest-700">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-forest-800 uppercase tracking-wider">
                サポート専用メールアドレス
              </p>
              <a
                href="mailto:support@digipin-app.jp"
                className="text-base sm:text-lg font-bold text-forest-900 hover:text-forest-700 hover:underline block font-mono"
              >
                support@digipin-app.jp
              </a>
              <p className="text-xs text-gray-500">
                受付時間: 24時間受付（原則3営業日以内に返信いたします）
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-forest-600" />
              お問い合わせ時のお願い
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 space-y-2 border border-gray-200">
              <p>
                迅速な対応のため、メール本文に以下の情報をご記載いただけますと幸いです。
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>ご登録のアカウント名（設定画面より確認可能）</li>
                <li>ご利用環境（iPhoneアプリ / Androidアプリ / PCブラウザ / スマホブラウザ）</li>
                <li>端末ID（設定画面下部の「デバッグ情報」に記載された英数字コード ※任意）</li>
                <li>お問い合わせ内容（不具合の場合は、発生した状況やエラー画面の文言）</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-gray-900">よくあるご質問</h3>
            <div className="space-y-2 text-xs">
              <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/50">
                <p className="font-bold text-gray-800 mb-1">Q. 機種変更時のデータ引き継ぎはどうすればいいですか？</p>
                <p className="text-gray-600">
                  旧端末の「設定」画面にある「メールアドレス連携・引き継ぎ」からメールアドレスを登録後、新端末でも同じメールアドレスで認証を行うことでデータを引き継ぐことができます。
                </p>
              </div>
              <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/50">
                <p className="font-bold text-gray-800 mb-1">Q. 電波の届かないゴルフ場でも写真登録できますか？</p>
                <p className="text-gray-600">
                  アプリ版ではオフライン対応機能を搭載しており、撮影した証拠写真は端末内に一時保存されます。電波の通じるクラブハウス等に戻った際に自動的にサーバーへ同期されます。
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1.5 text-forest-700">
              <CheckCircle className="w-4 h-4" />
              <span>デジピン ユーザーサポート</span>
            </div>
            <span>© 2026 デジピン All Rights Reserved.</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactScreen;
