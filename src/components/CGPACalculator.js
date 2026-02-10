import React, { useState, useEffect, useRef } from 'react';

// Standard Credits for the 8 Semesters (Defined outside to be stable)
const semesterCredits = [19.5, 19.5, 21.5, 21.5, 21.5, 21.5, 23.0, 12.0];

const CGPACalculator = () => {
    const [sgpas, setSgpas] = useState(Array(8).fill(''));
    const [cgpa, setCgpa] = useState(null);
    const [activeSemesters, setActiveSemesters] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const hasMounted = useRef(false);

    // Load from Cloud
    useEffect(() => {
        const fetchCGPA = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const res = await fetch('/api/cgpa', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    // Map backend data (Array of objects) to our sgpas array
                    const newSgpas = Array(8).fill('');
                    data.forEach(record => {
                        const index = parseInt(record.semester.replace('S', '')) - 1;
                        if (index >= 0 && index < 8) {
                            newSgpas[index] = record.sgpa;
                        }
                    });
                    setSgpas(newSgpas);
                }
            } catch (err) {
                console.error("Failed to load CGPA data", err);
            }
        };
        fetchCGPA();
    }, []);

    const handleSgpaChange = (index, value) => {
        const newSgpas = [...sgpas];
        newSgpas[index] = value;
        setSgpas(newSgpas);
    };

    // Calculate & Auto-Save
    useEffect(() => {
        let totalWeightedPoints = 0;
        let totalCredits = 0;
        let count = 0;

        sgpas.forEach((sgpa, index) => {
            const val = parseFloat(sgpa);
            if (!isNaN(val) && val > 0 && val <= 10) {
                totalWeightedPoints += val * semesterCredits[index];
                totalCredits += semesterCredits[index];
                count++;
            }
        });

        setActiveSemesters(count);

        if (totalCredits > 0) {
            setCgpa((totalWeightedPoints / totalCredits).toFixed(2));
        } else {
            setCgpa(null);
        }

        // Auto-Save Logic (Debounced or conditional)
        if (hasMounted.current) {
            const saveData = async () => {
                setIsSaving(true);
                const token = localStorage.getItem('token');
                if (!token) return;

                const records = sgpas.map((sgpa, index) => {
                    if (!sgpa) return null;
                    return {
                        name: `S${index + 1}`,
                        credits: semesterCredits[index].toString(),
                        sgpa: sgpa
                    };
                }).filter(Boolean);

                try {
                    await fetch('/api/cgpa', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ records })
                    });
                } catch (err) {
                    console.error("Failed to save CGPA", err);
                } finally {
                    setIsSaving(false);
                }
            };

            const timeoutId = setTimeout(saveData, 1000); // 1s debounce
            return () => clearTimeout(timeoutId);
        } else {
            hasMounted.current = true;
        }
    }, [sgpas]);

    const getGradeColor = (val) => {
        if (!val) return 'var(--text-muted)';
        if (val >= 8.0) return 'var(--success-glow)';
        if (val >= 6.5) return 'var(--warning-glow)';
        return 'var(--danger-glow)';
    };

    return (
        <div className="cgpa-container" style={{ marginTop: '20px' }}>
            {/* --- Compact Semester Grid (Top) --- */}
            <div className="glass-panel" style={{ marginBottom: '30px', padding: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>
                        Semester Log
                    </h3>
                    {isSaving && <span style={{ fontSize: '0.7rem', color: 'var(--primary-glow)', animation: 'pulse 1s infinite' }}>Saving...</span>}
                </div>
                
                {/* Side-by-side Cube Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '15px' }}>
                    {semesterCredits.map((credits, index) => (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <label style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)' }}>
                                S{index + 1}
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="10"
                                value={sgpas[index]}
                                onChange={(e) => handleSgpaChange(index, e.target.value)}
                                placeholder="-"
                                style={{ 
                                    width: '100%',
                                    height: '60px',
                                    textAlign: 'center', 
                                    fontSize: '1.1rem', 
                                    fontWeight: '700', 
                                    padding: '0',
                                    border: `2px solid ${sgpas[index] ? 'var(--primary-glow)' : 'rgba(0,0,0,0.1)'}`,
                                    background: sgpas[index] ? 'rgba(0, 82, 255, 0.05)' : 'rgba(0,0,0,0.05)',
                                    borderRadius: '12px',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', opacity: 0.6 }}>{credits} Cr</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- Cumulative Performance HUD (Bottom) --- */}
            <div className="glass-panel" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden', padding: '40px 20px' }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                        Cumulative Grade Point Average
                    </div>
                    
                    <div style={{ 
                        fontSize: '5rem', 
                        fontWeight: '900', 
                        color: getGradeColor(cgpa),
                        lineHeight: 1,
                        transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                        textShadow: `0 0 40px ${getGradeColor(cgpa)}40`
                    }}>
                        {cgpa || '0.00'}
                    </div>

                    <div style={{ marginTop: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 15px', background: 'rgba(0,0,0,0.05)', borderRadius: '50px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeSemesters > 0 ? 'var(--success-glow)' : 'var(--text-muted)', boxShadow: activeSemesters > 0 ? '0 0 8px var(--success-glow)' : 'none' }}></span>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-main)' }}>
                            {activeSemesters} / 8 Active
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CGPACalculator;
