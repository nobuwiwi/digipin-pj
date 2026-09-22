import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsScreen: React.FC = () => {
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
        <h1 className="ml-2 text-lg font-semibold text-gray-900">利用規約</h1>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-6">
        <div className="bg-white rounded-lg shadow-sm p-6 prose prose-indigo max-w-none">
          <p className="text-gray-600 text-sm mb-6">最終更新日: 2024年X月X日</p>
          
          <h2>第1条（適用）</h2>
          <p>
            本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。
          </p>

          <h2>第2条（利用登録）</h2>
          <p>
            本サービスにおいては、登録希望者が本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。
          </p>

          {/* 今後必要な規約をここに追加します */}
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md text-gray-500 text-sm">
            ※ ここに詳細な利用規約のテキストが入ります。
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsScreen;
