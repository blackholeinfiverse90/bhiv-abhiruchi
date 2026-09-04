import { useAuth } from '../context/AuthContext';
import MultiDomainAssignment from '../components/MultiDomainAssignment';
import { useNavigate } from 'react-router-dom';

export default function MultiDomainTest() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleComplete = (results) => {
    console.log('✅ Assessment completed!', results);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <MultiDomainAssignment
        userId={user?.id || user?._id}
        userEmail={user?.email}
        onComplete={handleComplete}
      />
    </div>
  );
}
