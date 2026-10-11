import React from 'react';
import { ArrowLeft, Scale } from 'lucide-react';

const LegalInfoScreen: React.FC = () => {
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
          <Scale className="w-5 h-5 text-forest-700" />
          <h1 className="text-base font-bold text-gray-900">特定商取引法に基づく表記</h1>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-forest-100 p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-forest-900 mb-2">
              特定商取引法に基づく表記
            </h2>
            <p className="text-sm text-gray-600">
              「特定商取引に関する法律」第11条に基づき、以下のとおり表示いたします。
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm border-collapse">
              <tbody>
                <tr className="border-b border-gray-100">
                  <th className="py-4 pr-4 font-bold text-gray-900 whitespace-nowrap w-44 sm:w-48 align-top">
                    サービス提供事業者
                  </th>
                  <td className="py-4 text-gray-700">
                    デジピン運営事務局
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th className="py-4 pr-4 font-bold text-gray-900 align-top">
                    運営責任者
                  </th>
                  <td className="py-4 text-gray-700">
                    
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th className="py-4 pr-4 font-bold text-gray-900 align-top">
                    所在地
                  </th>
                  <td className="py-4 text-gray-700 leading-relaxed">
                    請求があった場合、遅滞なく開示いたします。<br />
                    <span className="text-xs text-gray-500">※下記お問い合わせ窓口までご請求ください。</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th className="py-4 pr-4 font-bold text-gray-900 align-top">
                    電話番号
                  </th>
                  <td className="py-4 text-gray-700">
                    請求があった場合、遅滞なく開示いたします。<br />
                    <span className="text-xs text-gray-500">※お問い合わせはメール窓口をご利用ください。</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th className="py-4 pr-4 font-bold text-gray-900 align-top">
                    メールアドレス
                  </th>
                  <td className="py-4 text-gray-700 font-mono">
                    info@dantaisen.com
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th className="py-4 pr-4 font-bold text-gray-900 align-top">
                    販売価格（利用料）
                  </th>
                  <td className="py-4 text-gray-700">
                    基本機能は無料でご利用いただけます。<br />
                    有料プランや課金サービスを提供する場合は、各購入画面に明示いたします。
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th className="py-4 pr-4 font-bold text-gray-900 align-top">
                    商品代金以外の必要料金
                  </th>
                  <td className="py-4 text-gray-700">
                    本サービス利用に伴うインターネット通信料・パケット通信料はお客様のご負担となります。
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th className="py-4 pr-4 font-bold text-gray-900 align-top">
                    お支払方法
                  </th>
                  <td className="py-4 text-gray-700">
                    App Store決済、Google Play決済、クレジットカード決済（有料サービス提供時）
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th className="py-4 pr-4 font-bold text-gray-900 align-top">
                    役務の提供時期
                  </th>
                  <td className="py-4 text-gray-700">
                    決済完了または利用登録完了後、直ちにご利用いただけます。
                  </td>
                </tr>
                <tr>
                  <th className="py-4 pr-4 font-bold text-gray-900 align-top">
                    返品・解約・キャンセル
                  </th>
                  <td className="py-4 text-gray-700 leading-relaxed">
                    デジタルコンテンツおよびオンラインサービスの性質上、決済完了後の返金・キャンセルはお受けできません。<br />
                    サブスクリプション等の定期課金サービスについては、次回更新日の前日までに解約手続きを行うことで、次回以降の請求を停止することができます。
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>最終改定日: 2026年10月11日</span>
            <span>© 2026 デジピン All Rights Reserved.</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LegalInfoScreen;
