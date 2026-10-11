import React from 'react';
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react';

const TermsScreen: React.FC = () => {
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
          <FileText className="w-5 h-5 text-forest-700" />
          <h1 className="text-base font-bold text-gray-900">利用規約</h1>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-forest-100 p-6 sm:p-8">
          <div className="border-b border-gray-100 pb-5 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-forest-900 mb-2">
              デジピン 利用規約
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span>制定日: 2026年4月1日</span>
              <span>最終改定日: 2026年10月11日</span>
            </div>
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-gray-700">
            <p>
              この利用規約（以下「本規約」といいます。）は、デジピン運営事務局（以下「当社」といいます。）が提供するゴルフコンペ証拠写真・記録管理サービス「デジピン」（Web版およびスマートフォンアプリ版を含み、以下「本サービス」といいます。）の利用条件を定めるものです。本サービスをご利用になるすべての方（以下「ユーザー」といいます。）は、本規約に同意の上、本サービスをご利用ください。
            </p>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第1条（適用）
              </h3>
              <p>
                1. 本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されます。
              </p>
              <p>
                2. 当社が本サービス上で掲載する各種の利用案内、注意事項、プライバシーポリシー等の諸規定は、本規約の一部を構成するものとします。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第2条（定義）
              </h3>
              <p>本規約において使用する用語の定義は、以下のとおりとします。</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-gray-900">「端末ID」</strong>: 本サービス利用時に端末（ブラウザまたはアプリ）ごとに発行される一意の識別子をいいます。
                </li>
                <li>
                  <strong className="text-gray-900">「アカウント」</strong>: 端末IDまたは登録されたメールアドレスに基づいて識別される利用者の資格・データをいいます。
                </li>
                <li>
                  <strong className="text-gray-900">「コンペ」</strong>: ユーザーが本サービス上で作成・管理するゴルフ競技のイベント単位をいいます。
                </li>
                <li>
                  <strong className="text-gray-900">「証拠画像」</strong>: ニアピン賞、ドラコン賞等の測定結果や証拠として、ユーザーが撮影・アップロードする写真データをいいます。
                </li>
                <li>
                  <strong className="text-gray-900">「代表者機能」</strong>: 他の参加者等とコンペ情報や証拠画像の閲覧・登録権限を共有・連携する機能をいいます。
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第3条（利用開始・アカウントの管理）
              </h3>
              <p>
                1. 本サービスは、利用端末に割り当てられた端末IDによりパスワード不要で利用を開始できます。利用開始にあたり、ユーザーは自身のアカウント名を登録するものとします。
              </p>
              <p>
                2. ユーザーは、本サービス内でメールアドレスを連携することにより、端末間でのデータ同期や、機種変更等に伴うアカウント引き継ぎ機能を利用することができます。
              </p>
              <p>
                3. メールアドレス連携に際して送信される認証コード（ワンタイムパスワード）は、ユーザー本人のみが使用するものとし、第三者への漏洩・開示を行ってはなりません。
              </p>
              <p>
                4. 端末の紛失、盗難、または認証情報の管理不備に起因して生じた損害について、当社に故意または重過失がある場合を除き、当社は一切の責任を負いません。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第4条（本サービスの内容と機能）
              </h3>
              <p>本サービスにおいて提供される主な機能は以下のとおりです。</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>ゴルフコンペの作成、コース・ホール情報、賞種別（ニアピン・ドラコン等）の設定</li>
                <li>端末カメラまたは画像ライブラリを利用した証拠写真の撮影・アップロードおよび測定距離・メモの記録</li>
                <li>QRコードまたはアカウント検索を利用した代表者の相互連携および証拠写真の共有管理</li>
                <li>電波状況の悪いゴルフ場等におけるオフラインでの証拠画像の一時保存およびオンライン復帰時の自動同期</li>
                <li>メールアドレス認証を通じたPC・スマートフォン等複数端末間でのデータ同期・引き継ぎ</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第5条（ユーザーの責任およびデータの管理）
              </h3>
              <p>
                1. ユーザーは、自己の責任において本サービスを利用するものとし、本サービスの利用およびその結果について一切の責任を負います。
              </p>
              <p>
                2. ユーザーは、証拠写真の撮影および投稿にあたり、ゴルフ場の規則・マナーを遵守するとともに、同伴競技者や第三者の肖像権、プライバシー権を侵害しないよう配慮するものとします。
              </p>
              <p>
                3. ユーザーが本サービス上で登録したデータ（証拠画像、スコア、距離、メモ等）のバックアップは、ユーザー自身が適切に管理するものとします。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第6条（禁止事項）
              </h3>
              <p>ユーザーは、本サービスの利用にあたり、以下の各号のいずれかに該当する行為をしてはなりません。</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>法令または公序良俗に違反する行為、または犯罪行為に関連する行為</li>
                <li>当社、他のユーザー、または第三者の知的財産権、肖像権、プライバシー権、名誉その他の権利を侵害する行為</li>
                <li>虚偽の測定データ、改ざんされた画像、またはゴルフコンペの結果を不正に歪めるデータを登録する行為</li>
                <li>ゴルフプレイ中の安全を脅かす態様での端末操作、またはゴルフ場業務を妨害する行為</li>
                <li>本サービスのネットワーク、サーバー、APIに不正にアクセスし、または過度な負荷をかける行為</li>
                <li>本サービスをリバースエンジニアリング、逆アセンブル、逆コンパイル等の解析を行う行為</li>
                <li>営利目的での無断転載、宣伝・広告、または第三者へのアカウント貸与・譲渡行為</li>
                <li>その他、当社が不適切と合理的に判断する行為</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第7条（利用制限およびアカウントの停止）
              </h3>
              <p>
                当社は、ユーザーが本規約のいずれかの条項に違反した場合、事前の通知なく、該当データの削除、本サービスの全部もしくは一部の利用停止、またはアカウントの登録抹消を行うことができるものとします。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第8条（本サービスの変更・中断・終了）
              </h3>
              <p>
                1. 当社は、以下のいずれかの事由が生じた場合、ユーザーに事前に通知することなく、本サービスの提供を一時的に中断または停止することができます。
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>システム保守、点検、更新を定期または緊急に行う場合</li>
                <li>地震、落雷、火災、風水害、停電、天災地変等の不可抗力によりサービスの提供が困難となった場合</li>
                <li>通信回線やクラウドインフラ等の障害により運用が困難となった場合</li>
              </ul>
              <p>
                2. 当社は、相当な予告期間を設けて本サービス上に告知することにより、本サービスの提供を終了または内容を変更することができます。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第9条（権利帰属）
              </h3>
              <p>
                1. 本サービスに関する著作権、商標権その他一切の知的財産権は、当社または正当な権利者に帰属します。
              </p>
              <p>
                2. ユーザーが本サービスにアップロードした証拠画像等のデータに関する権利はユーザーに留保されます。ただし、ユーザーは当社に対し、本サービスの運営、保守、不具合調査、データ表示の範囲において、無償かつ非独占的にこれを利用することを許諾するものとします。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第10条（免責事項）
              </h3>
              <p>
                1. 当社は、本サービスがユーザーの特定の目的に適合すること、期待する機能・正確性・有用性を有すること、および不具合が生じないことについて、明示的にも黙示的にも保証しません。
              </p>
              <p>
                2. コンペの順位判定、賞の授与、参加者間での賞金・賞品の取り決めに関するトラブルについて、当社は一切関与せず、ユーザー間の協議により解決するものとします。
              </p>
              <p>
                3. 地下、山間部、電波不通エリア等における通信障害、端末のバッテリー切れ、データ保存の不備等によって生じた損害について、当社は責任を負いません。
              </p>
              <p>
                4. 当社が損害賠償責任を負う場合であっても、当社の責任は、ユーザーに現実に生じた直接かつ通常の損害に限られ、予見の有無を問わず特別の事情から生じた損害については責任を負わないものとします。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第11条（規約の改定）
              </h3>
              <p>
                当社は、必要と判断した場合には、ユーザーの承諾を得ることなく本規約を変更できるものとします。変更後の利用規約は、本サービス上に掲載した時点より効力を生じるものとし、改定後に本サービスを利用した時点で、ユーザーは変更後の規約に同意したものとみなされます。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第12条（個人情報の取扱い）
              </h3>
              <p>
                本サービスの利用によって取得するユーザーの個人情報については、当社が別途定める「プライバシーポリシー」に従い適切に取り扱うものとします。
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-forest-900 border-l-4 border-forest-600 pl-3">
                第13条（準拠法および管轄裁判所）
              </h3>
              <p>
                1. 本規約の解釈および適用にあたっては、日本法を準拠法とします。
              </p>
              <p>
                2. 本サービスに関して当社とユーザーとの間に紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1.5 text-forest-700">
              <ShieldCheck className="w-4 h-4" />
              <span>デジピン運営事務局</span>
            </div>
            <span>© 2026 デジピン All Rights Reserved.</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsScreen;
