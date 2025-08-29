import Analytics from '../components/Admin/Analytics.jsx';

const AdminAnalytics = () => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Analytics & Reporting</h1>
        <p className="text-gray-600">Comprehensive platform analytics and insights</p>
      </div>
      
      <Analytics />
    </div>
  );
};

export default AdminAnalytics;

