import React, { useState, useEffect } from 'react';
import { Save, Upload, Printer, Building, FileText, Database, Settings as SettingsIcon } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    shopName: '',
    tagline: '',
    phone: '',
    email: '',
    address: '',
    gstNo: '',
    panNo: '',
    fssaiNo: '',
    licenseNo: '',
    printerName: '',
    paperSize: '80mm',
    printCopies: 1,
    autoPrint: false,
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    smtpFromName: '',
    backupEnabled: true,
  });

  const [printers, setPrinters] = useState([]);

  useEffect(() => {
    fetchSettings();
    loadPrinters();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      if (data.success && data.data) {
        setSettings(prev => ({ ...prev, ...data.data }));
      }
      
      // Merge local printer settings
      if (window.electronAPI && window.electronAPI.printer) {
        const localSettings = await window.electronAPI.printer.getSettings();
        setSettings(prev => ({ ...prev, ...localSettings }));
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadPrinters = async () => {
    if (window.electronAPI && window.electronAPI.printer) {
      try {
        const list = await window.electronAPI.printer.list();
        setPrinters(list);
      } catch (err) {
        console.error("Failed to load printers:", err);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Save global settings to DB
      await api.put('/settings', settings);
      
      // Save local printer settings via IPC
      if (window.electronAPI && window.electronAPI.printer) {
        await window.electronAPI.printer.saveSettings({
          printerName: settings.printerName,
          paperWidth: settings.paperSize,
          copies: Number(settings.printCopies),
          autoPrint: settings.autoPrint,
          silent: true,
        });
      }
      
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      const token = localStorage.getItem('km_token');
      const response = await fetch('http://localhost:5000/api/backup', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Backup failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `krushimitra_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Database backed up successfully');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm('WARNING: Restoring will overwrite all current data. Are you sure you want to proceed?')) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const payload = JSON.parse(event.target.result);
        const res = await api.post('/backup/restore', payload);
        if (res.success) {
          toast.success('Database restored successfully! Reloading...');
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (error) {
        toast.error('Restore failed: ' + (error.response?.data?.message || error.message));
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return <div className="p-6">Loading settings...</div>;
  }

  // Hide page if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="glass-panel p-8 rounded-2xl text-center">
          <h2 className="text-xl font-bold text-red-400">Access Denied</h2>
          <p className="text-text-secondary mt-2">You do not have permission to view settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-8 h-8 text-primary-500" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">System Settings</h1>
          <p className="text-text-secondary">Manage your shop details, printing, and integrations</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-2">
          {[
            { id: 'general', icon: Building, label: 'General Info' },
            { id: 'billing', icon: FileText, label: 'Billing & Tax' },
            { id: 'printing', icon: Printer, label: 'Receipt Printer' },
            { id: 'advanced', icon: Database, label: 'Advanced / Email' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' 
                  : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6">
            
            {/* General Info */}
            {activeTab === 'general' && (
              <div className="space-y-4 animate-in fade-in">
                <h2 className="text-lg font-semibold text-text-primary mb-4 border-b border-border-color pb-2">Shop Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm text-text-secondary mb-1">Shop Name</label>
                    <input type="text" name="shopName" value={settings.shopName} onChange={handleChange} className="input-field" required />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-text-secondary mb-1">Tagline</label>
                    <input type="text" name="tagline" value={settings.tagline} onChange={handleChange} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Phone</label>
                    <input type="text" name="phone" value={settings.phone} onChange={handleChange} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Email</label>
                    <input type="email" name="email" value={settings.email} onChange={handleChange} className="input-field" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-text-secondary mb-1">Address</label>
                    <textarea name="address" value={settings.address} onChange={handleChange} className="input-field min-h-[80px]" required />
                  </div>
                </div>
              </div>
            )}

            {/* Billing & Tax */}
            {activeTab === 'billing' && (
              <div className="space-y-4 animate-in fade-in">
                <h2 className="text-lg font-semibold text-text-primary mb-4 border-b border-border-color pb-2">Registration Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">GSTIN</label>
                    <input type="text" name="gstNo" value={settings.gstNo} onChange={handleChange} className="input-field uppercase" />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">PAN Number</label>
                    <input type="text" name="panNo" value={settings.panNo} onChange={handleChange} className="input-field uppercase" />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">FSSAI / Seed License</label>
                    <input type="text" name="fssaiNo" value={settings.fssaiNo} onChange={handleChange} className="input-field uppercase" />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Other License No.</label>
                    <input type="text" name="licenseNo" value={settings.licenseNo} onChange={handleChange} className="input-field uppercase" />
                  </div>
                </div>
              </div>
            )}

            {/* Printing */}
            {activeTab === 'printing' && (
              <div className="space-y-4 animate-in fade-in">
                <h2 className="text-lg font-semibold text-text-primary mb-4 border-b border-border-color pb-2">Thermal Printer Configuration</h2>
                
                {printers.length === 0 && (
                  <div className="p-4 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-sm mb-4">
                    Desktop App features required to list thermal printers. Ensure you are running in Electron.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm text-text-secondary mb-1">Select Printer</label>
                    <select name="printerName" value={settings.printerName} onChange={handleChange} className="input-field">
                      <option value="">-- Default System Printer --</option>
                      {printers.map(p => (
                        <option key={p.name} value={p.name}>{p.displayName} {p.isDefault ? '(Default)' : ''}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Paper Size</label>
                    <select name="paperSize" value={settings.paperSize} onChange={handleChange} className="input-field">
                      <option value="80mm">80mm (Standard Receipt)</option>
                      <option value="58mm">58mm (Small Receipt)</option>
                      <option value="A4">A4 (Laser/Inkjet)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Print Copies</label>
                    <input type="number" name="printCopies" min="1" max="5" value={settings.printCopies} onChange={handleChange} className="input-field" />
                  </div>

                  <div className="col-span-2 flex items-center gap-3 mt-2">
                    <input type="checkbox" id="autoPrint" name="autoPrint" checked={settings.autoPrint} onChange={handleChange} className="w-5 h-5 rounded border-border-color bg-bg-secondary text-primary-500 focus:ring-primary-500" />
                    <label htmlFor="autoPrint" className="text-sm text-text-primary">Auto-print receipt on save (No dialog)</label>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced / Email / DB */}
            {activeTab === 'advanced' && (
              <div className="space-y-4 animate-in fade-in">
                
                {/* DB Backup */}
                <h2 className="text-lg font-semibold text-text-primary mb-4 border-b border-border-color pb-2">Database Management</h2>
                <div className="p-4 bg-surface-hover border border-divider/50 rounded-xl mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-content">Backup & Restore</h3>
                    <p className="text-sm text-content-muted">Download a full JSON backup of your database or restore from a previous file.</p>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={handleBackup} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-content rounded-lg transition-colors flex items-center gap-2 text-sm font-medium">
                      <Database className="w-4 h-4" /> Backup
                    </button>
                    <label className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <Upload className="w-4 h-4" /> Restore
                      <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                    </label>
                  </div>
                </div>

                <h2 className="text-lg font-semibold text-text-primary mb-4 border-b border-border-color pb-2">SMTP Setup (For Email Invoices)</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">SMTP Host</label>
                    <input type="text" name="smtpHost" value={settings.smtpHost} onChange={handleChange} placeholder="smtp.gmail.com" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">SMTP Port</label>
                    <input type="text" name="smtpPort" value={settings.smtpPort} onChange={handleChange} placeholder="587" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">SMTP Username</label>
                    <input type="text" name="smtpUser" value={settings.smtpUser} onChange={handleChange} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">SMTP Password (App Password)</label>
                    <input type="password" name="smtpPass" value={settings.smtpPass} onChange={handleChange} className="input-field" />
                  </div>
                </div>

                <h2 className="text-lg font-semibold text-text-primary mb-4 border-b border-border-color pb-2">System Behaviors</h2>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="backupEnabled" name="backupEnabled" checked={settings.backupEnabled} onChange={handleChange} className="w-5 h-5 rounded border-border-color bg-bg-secondary text-primary-500 focus:ring-primary-500" />
                  <label htmlFor="backupEnabled" className="text-sm text-text-primary">Enable automatic database backups</label>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-border-color flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
