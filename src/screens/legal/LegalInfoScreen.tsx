import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const LegalInfoScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="戻る"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="ml-2 text-lg font-semibold text-gray-900">特定商取引法に基づく表記</h1>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <table className="min-w-full text-left text-sm border-collapse">
            <tbody>
              <tr className="border-b border-gray-200">
                <th className="py-4 pr-4 font-medium text-gray-900 whitespace-nowrap w-48">販売事業者名</th>
                <td className="py-4 text-gray-700">株式会社○○○</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="py-4 pr-4 font-medium text-gray-900">代表責任者名</th>
                <td className="py-4 text-gray-700">山田 太郎</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="py-4 pr-4 font-medium text-gray-900">所在地</th>
                <td className="py-4 text-gray-700">〒123-4567<br/>東京都○○区○○ 1-2-3</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="py-4 pr-4 font-medium text-gray-900">電話番号</th>
                <td className="py-4 text-gray-700">03-XXXX-XXXX</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="py-4 pr-4 font-medium text-gray-900">メールアドレス</th>
                <td className="py-4 text-gray-700">info@your-domain.com</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="py-4 pr-4 font-medium text-gray-900">販売価格</th>
                <td className="py-4 text-gray-700">各商品・サービスのご購入ページにて表示する価格</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="py-4 pr-4 font-medium text-gray-900">商品代金以外の必要料金</th>
                <td className="py-4 text-gray-700">
                  インターネット接続にかかわる通信回線等の諸費用
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="py-4 pr-4 font-medium text-gray-900">お支払方法</th>
                <td className="py-4 text-gray-700">クレジットカード決済、Apple Pay、Google Pay</td>
              </tr>
              <tr>
                <th className="py-4 pr-4 font-medium text-gray-900">返品・キャンセル・交換について</th>
                <td className="py-4 text-gray-700">
                  商品の性質上、原則として返品・キャンセルはお受けできません。<br/>
                  ただし、当社の責めに帰すべき事由がある場合はこの限りではありません。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default LegalInfoScreen;
