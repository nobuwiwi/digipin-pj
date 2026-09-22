import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyScreen: React.FC = () => {
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
        <h1 className="ml-2 text-lg font-semibold text-gray-900">プライバシーポリシー</h1>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-6">
        <div className="bg-white rounded-lg shadow-sm p-6 prose prose-indigo max-w-none">
          <p className="text-gray-600 text-sm mb-6">最終更新日: 2024年X月X日</p>
          
          <h2>第1条（個人情報の収集方法）</h2>
          <p>
            当社は、ユーザーが利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレスなどの個人情報をお尋ねすることがあります。
          </p>

          <h2>第2条（個人情報を収集・利用する目的）</h2>
          <p>
            当社が個人情報を収集・利用する目的は、以下のとおりです。
          </p>
          <ul>
            <li>当社サービスの提供・運営のため</li>
            <li>ユーザーからのお問い合わせに回答するため</li>
            <li>その他、上記利用目的に付随する目的のため</li>
          </ul>

          {/* 今後必要なプライバシーポリシーをここに追加します */}
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md text-gray-500 text-sm">
            ※ ここに詳細なプライバシーポリシーのテキストが入ります。
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyScreen;
