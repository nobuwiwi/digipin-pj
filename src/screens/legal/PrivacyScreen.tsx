import React from 'react';
import { ArrowLeft, Shield, Lock } from 'lucide-react';

const PrivacyScreen: React.FC = () => {
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
          <Shield className="w-5 h-5 text-forest-700" />
          <h1 className="text-base font-bold text-gray-900">プライバシーポリシー</h1>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-forest-100 p-6 sm:p-8">
          <div className="border-b border-gray-100 pb-5 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-forest-900 mb-2">
              デジピン プライバシーポリシー
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span>制定日: 2026年4月1日</span>
              <span>最終改定日: 2026年10月11日</span>
            </div>
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-gray-700">
            <p>
              デジピン運営事務局（以下「当社」といいます。）は、提供するゴルフコンペ証拠写真・記録管理サービス「デジピン」（Web版およびスマートフォンアプリ版を含み、以下「本サービス」といいます。）において取得するユーザーの個人情報および関連する情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
            </p>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第1条（取得する情報）
              </h3>
              <p>当社は、本サービスの提供にあたり、以下の情報を取得することがあります。</p>
              <div className="space-y-3 pl-2">
                <div>
                  <h4 className="font-semibold text-gray-900">1. 端末識別情報</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    端末ID（UUID）、OS種別・バージョン、デバイスモデル名など、端末を安全かつ正確に識別するための情報。
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">2. アカウント情報</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    ユーザーが任意に設定するアカウント名、表示名。
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">3. 連絡先および認証情報</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    メールアドレス連携・端末引き継ぎ機能利用時に提供されるメールアドレス、および本人確認のための認証トークン。
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">4. コンペおよび競技記録情報</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    コンペ名、開催日、ゴルフ場名、対象ホール番号、賞の種類（ニアピン賞、ドラコン賞等）、計測距離、メモ情報。
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">5. 証拠画像データ</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    端末のカメラで撮影または画像ライブラリから選択してアップロードされた証拠写真データ、および撮影日時等のメタデータ。
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">6. 利用ログ・アクセス情報</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    アクセス日時、IPアドレス、通信状況、エラーログ、オフライン同期キューの状態。
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第2条（情報の取得方法）
              </h3>
              <p>当社は、以下の適法かつ公正な手段によって情報を取得します。</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>ユーザーが本サービス利用時に入力または設定した情報の受領</li>
                <li>ユーザーが端末カメラまたは写真ライブラリからアップロードした画像データの受領</li>
                <li>本サービスの利用およびサーバーとの通信に伴う自動取得</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第3条（利用目的）
              </h3>
              <p>当社が取得した情報は、以下の目的のために利用されます。</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>本サービスの基本機能（コンペの作成、証拠写真の保存・一覧表示、距離の記録）の提供・運営</li>
                <li>端末IDおよびメールアドレスによるユーザー識別、本人確認、セキュリティ認証</li>
                <li>PC・スマートフォン等の複数端末間におけるデータ同期および機種変更時のアカウント引き継ぎ</li>
                <li>QRコード連携および代表者機能を通じた同伴競技者との安全なデータ共有</li>
                <li>ゴルフ場等のオフライン環境におけるデータ一時保存およびオンライン復帰時の自動同期処理</li>
                <li>不具合の調査、システムの保守・運用、不正アクセスや規約違反行為の検知・防止</li>
                <li>ユーザーからのお問い合わせへの対応および重要なお知らせの伝達</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第4条（端末機能・権限へのアクセス）
              </h3>
              <p>本サービスのスマートフォンアプリ版では、以下の端末機能へのアクセス権限を要求することがあります。</p>
              <div className="bg-forest-50/60 rounded-xl p-4 border border-forest-100 space-y-2 text-xs">
                <div>
                  <strong className="text-forest-900">・カメラへのアクセス:</strong>
                  <span className="text-gray-700"> ニアピン・ドラコン等の証拠写真撮影、および代表者登録用のQRコードスキャンのために使用します。</span>
                </div>
                <div>
                  <strong className="text-forest-900">・写真ライブラリへのアクセス:</strong>
                  <span className="text-gray-700"> 撮影済みの写真から証拠画像を選択してアップロードするために使用します。</span>
                </div>
                <div>
                  <strong className="text-forest-900">・ローカルストレージ（AsyncStorage / SQLite等）:</strong>
                  <span className="text-gray-700"> 端末IDの保持、および電波の届かないオフライン環境での証拠画像の一時保存のために使用します。</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                ※ 権限の許可は端末の設定画面からいつでも変更できますが、許可を無効にした場合、写真撮影等の関連機能が利用できなくなる場合があります。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第5条（安全管理措置）
              </h3>
              <p>
                当社は、取得した情報の漏洩、滅失または毀損の防止その他の安全管理のために、SSL/TLSによる通信の暗号化、アクセス権限の最小化、セキュアなクラウドデータベース（Supabase等）の利用など、合理的かつ適切なセキュリティ対策を講じます。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第6条（第三者提供の制限）
              </h3>
              <p>
                当社は、法令に基づく場合や生命・身体の保護に緊急の必要がある場合を除き、あらかじめユーザーの同意を得ることなく、個人情報を第三者に提供しません。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第7条（情報の共有範囲について）
              </h3>
              <p>
                本サービスはゴルフコンペの参加者同士で証拠写真やスコアを共有する機能を有しています。同一コンペの参加者または代表者として登録されたユーザー間においては、アカウント名、登録された証拠写真、計測距離、メモが閲覧可能となりますので、登録内容にご留意ください。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第8条（個人情報の開示・訂正・利用停止・削除）
              </h3>
              <p>
                ユーザーは、当社が保有する自己の個人情報について、開示、訂正、追加、削除、利用停止を請求することができます。請求を希望される場合は、第10条のお問い合わせ窓口までご連絡ください。ご本人からの請求であることを確認の上、法令に従い合理的な期間内に対応いたします。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第9条（プライバシーポリシーの改定）
              </h3>
              <p>
                当社は、法令の変更やサービス内容の改定等に伴い、本ポリシーを随時改定することがあります。改定後のプライバシーポリシーは、本サービス上に掲載された時点から効力を生じるものとします。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第10条（お問い合わせ窓口）
              </h3>
              <p>
                本ポリシーおよび個人情報の取扱いに関するご質問、ご相談、苦情等は、本サービスのお問い合わせ窓口（info@dantaisen.com またはアプリ内お問い合わせ）までご連絡ください。
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1.5 text-forest-700">
              <Lock className="w-4 h-4" />
              <span>デジピン運営事務局 個人情報保護管理担当</span>
            </div>
            <span>© 2026 デジピン All Rights Reserved.</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyScreen;
