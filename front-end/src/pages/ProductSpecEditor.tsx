import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Form/Button';

type BadgeVariant = "active" | "draft" | "retired" | "cfs" | "rfs" | "resource";

interface Characteristic {
  name: string;
  valueType: string;
  variant: BadgeVariant; // Map for UI display
  unit: string;
  value: string;
}

interface ProductSpec {
  id: string;
  name: string;
  productSpecCharacteristic: Characteristic[];
}

const ProductSpecEditor: React.FC = () => {
  const [specs, setSpecs] = useState<ProductSpec[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<ProductSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Initial Load: Get all Specifications from DB
  useEffect(() => {
    fetch('http://localhost:3000/api/v1/product-specification')
      .then(res => res.json())
      .then(data => {
        setSpecs(data);
        if (data.length > 0) setSelectedSpec(data[0]);
        setLoading(false);
      })
      .catch(err => console.error("Load Error:", err));
  }, []);

  // 2. Handle input changes locally
  const updateCharValue = (index: number, val: string) => {
    if (!selectedSpec) return;
    const newChars = [...selectedSpec.productSpecCharacteristic];
    newChars[index].value = val;
    setSelectedSpec({ ...selectedSpec, productSpecCharacteristic: newChars });
  };

  // 3. Persist to DB
  const saveToDatabase = async () => {
    if (!selectedSpec) return;
    setSaving(true);
    try {
      await fetch(`http://localhost:3000/api/v1/product-specification/${selectedSpec.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSpecCharacteristic: selectedSpec.productSpecCharacteristic })
      });
      alert("Successfully saved to database!");
    } catch (err) {
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Fetching specifications...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Spec Editor</h1>
        <p className="page-description">Managing live data for: <strong>{selectedSpec?.name}</strong></p>
      </div>

      <Card>
        <label className="form-label">Active Specification</label>
        <select 
          className="form-select"
          value={selectedSpec?.id}
          onChange={(e) => setSelectedSpec(specs.find(s => s.id === e.target.value) || null)}
        >
          {specs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Card>

      <Card>
        <div className="char-list">
          {selectedSpec?.productSpecCharacteristic.map((char, i) => (
            <div key={i} className="char-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <strong>{char.name}</strong>
                <Badge variant={char.variant || 'active'} label={char.valueType} />
              </div>
              <input 
                className="form-input" 
                style={{ flex: 1 }}
                value={char.value} 
                onChange={(e) => updateCharValue(i, e.target.value)} 
              />
              <span style={{ width: '60px' }}>{char.unit}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
          <Button variant="primary" onClick={saveToDatabase}>
            {saving ? 'Saving...' : '💾 Push Changes to DB'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProductSpecEditor;