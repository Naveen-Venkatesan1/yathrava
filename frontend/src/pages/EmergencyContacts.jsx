import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSafety } from '../context/SafetyContext';
import { ArrowLeft, Phone, UserPlus, Trash2, Shield, Star } from 'lucide-react';

export default function EmergencyContacts() {
  const navigate = useNavigate();
  const { emergencyContacts, addEmergencyContact, deleteEmergencyContact } = useSafety();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isPriority, setIsPriority] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName || !newPhone) return;
    
    await addEmergencyContact({
      name: newName,
      phone: newPhone,
      priority: isPriority
    });
    
    setNewName('');
    setNewPhone('');
    setIsPriority(false);
    setIsAdding(false);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '80vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
        >
          <ArrowLeft style={{ color: '#0f172a' }} size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Emergency Contacts</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Manage who receives your SOS alerts</p>
        </div>
      </div>

      {/* Add New Contact Button / Form */}
      <div style={{ background: '#fff', borderRadius: '1.25rem', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        {!isAdding ? (
          <button 
            onClick={() => setIsAdding(true)}
            style={{ width: '100%', background: '#eff6ff', color: '#1d4ed8', border: '2px dashed #bfdbfe', padding: '1rem', borderRadius: '1rem', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#e0f2fe'}
            onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
          >
            <UserPlus size={18} /> Add New Emergency Contact
          </button>
        ) : (
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Add Contact</h3>
            <input 
              type="text" placeholder="Contact Name (e.g. Brother)" value={newName} onChange={e => setNewName(e.target.value)} required
              style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
            />
            <input 
              type="tel" placeholder="Phone Number" value={newPhone} onChange={e => setNewPhone(e.target.value)} required
              style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#475569', cursor: 'pointer' }}>
              <input type="checkbox" checked={isPriority} onChange={e => setIsPriority(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#3b82f6' }} />
              Make this a Priority Contact (Auto-Called during SOS)
            </label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setIsAdding(false)} style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ flex: 1, padding: '0.75rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Save Contact</button>
            </div>
          </form>
        )}
      </div>

      {/* Contacts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={20} color="#10b981" /> Saved Contacts
        </h2>
        
        {emergencyContacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '1rem', border: '1px dashed #cbd5e1' }}>
            No emergency contacts saved yet.
          </div>
        ) : (
          emergencyContacts.map(contact => (
            <div key={contact.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: contact.priority ? '#fee2e2' : '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: contact.priority ? '#dc2626' : '#0369a1' }}>
                  {contact.priority ? <Star size={20} fill="currentColor" /> : <Phone size={20} />}
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {contact.name}
                    {contact.priority && <span style={{ fontSize: '0.65rem', background: '#dc2626', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '999px', fontWeight: 800, textTransform: 'uppercase' }}>Priority</span>}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>{contact.phone}</div>
                </div>
              </div>
              <button 
                onClick={() => deleteEmergencyContact(contact.id)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.5rem' }}
                onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                title="Delete Contact"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
