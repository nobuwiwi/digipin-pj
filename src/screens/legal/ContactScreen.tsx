import React from 'react';
import { ArrowLeft, Mail } from 'lucide-react';

const ContactScreen: React.FC = () => {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="戻る"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="ml-2 text-lg font-semibold text-gray-900">お問い合わせ</h1>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-700 mb-6">
            本サービスに関するお問い合わせは、以下の窓口までお願いいたします。
          </p>
          
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Mail className="w-6 h-6 text-indigo-600" />
            <div>
              <p className="text-sm text-gray-500">メールアドレス</p>
              <p className="text-base font-medium text-gray-900">support@your-domain.com</p>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-md text-blue-800 text-sm">
            お問い合わせの際は、アプリに登録しているメールアドレスとお名前をご記載いただきますようお願いいたします。<br/>
            通常、3営業日以内に回答させていただきます。
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactScreen;
