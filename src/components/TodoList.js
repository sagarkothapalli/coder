import React, { useState, useEffect, useCallback } from 'react';

const TodoList = () => {
    const [todos, setTodos] = useState([]);
    const [newTodo, setNewTodo] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [loading, setLoading] = useState(true);
    const [isIgniting, setIsIgniting] = useState(false);
    const token = localStorage.getItem('token');

    const fetchTodos = useCallback(async () => {
        try {
            const res = await fetch('/api/todos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setTodos(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [token]);

    useEffect(() => {
        fetchTodos();
    }, [fetchTodos]);

    // --- OPTIMISTIC UPDATES (Instant Response) ---
    const addTodo = async (e) => {
        if (e) e.preventDefault();
        const text = newTodo.trim();
        if (!text) return;

        // 1. Instant UI Update
        const tempId = Date.now();
        const optimisticTodo = { id: tempId, text, priority, completed: false, isOptimistic: true };
        setTodos([optimisticTodo, ...todos]);
        setNewTodo('');
        setIsIgniting(true);
        setTimeout(() => setIsIgniting(false), 500);

        try {
            const res = await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text, priority })
            });
            if (res.ok) {
                const realTodo = await res.json();
                setTodos(prev => prev.map(t => t.id === tempId ? realTodo : t));
            } else {
                throw new Error("Stalled");
            }
        } catch (err) {
            setTodos(prev => prev.filter(t => t.id !== tempId));
            alert("Engine Stalled: Reverting task.");
        }
    };

    const toggleTodo = async (todo) => {
        const originalTodos = [...todos];
        setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t));

        try {
            const res = await fetch(`/api/todos/${todo.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...todo, completed: !todo.completed })
            });
            if (!res.ok) throw new Error("Stalled");
        } catch (err) {
            setTodos(originalTodos);
            alert("Sync Failed.");
        }
    };

    const deleteTodo = async (id) => {
        const originalTodos = [...todos];
        setTodos(prev => prev.filter(t => t.id !== id));
        try {
            const res = await fetch(`/api/todos/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Stalled");
        } catch (err) {
            setTodos(originalTodos);
        }
    };

    const completedCount = todos.filter(t => t.completed).length;
    const progress = todos.length > 0 ? (completedCount / todos.length) : 0;

    const getPriorityColor = (p) => {
        switch(p) {
            case 'HIGH': return 'var(--danger-glow)';
            case 'MEDIUM': return 'var(--warning-glow)';
            default: return 'var(--success-glow)';
        }
    };

    return (
        <div className="todo-container">
            {/* --- Supercar Track HUD --- */}
            <div className="glass-panel" style={{ marginBottom: '40px', padding: 'clamp(20px, 5vw, 50px)' }}>
                <div style={{ position: 'relative', width: '100%', height: '140px', background: 'rgba(0,0,0,0.1)', borderRadius: '25px', border: '2px solid var(--glass-border)', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '60px', right: '60px', height: '2px', background: 'repeating-linear-gradient(90deg, var(--text-muted) 0, var(--text-muted) 20px, transparent 20px, transparent 40px)', opacity: 0.2 }}></div>

                    <div style={{ position: 'absolute', left: '80px', right: '80px', height: '100%' }}>
                        <div style={{ 
                            position: 'absolute',
                            left: `${progress * 100}%`,
                            top: '50%',
                            transform: 'translate3d(-50%, -50%, 0)',
                            transition: 'left 1.2s cubic-bezier(0.23, 1, 0.32, 1)',
                            willChange: 'left',
                            zIndex: 10
                        }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ 
                                    position: 'absolute', right: '100%', top: '15px', 
                                    width: `${40 + (progress * 60)}px`, height: '12px', 
                                    background: 'linear-gradient(to left, var(--primary-glow), transparent)', 
                                    opacity: 0.7, filter: 'blur(6px)', borderRadius: '50%',
                                    transition: 'width 0.5s ease'
                                }}></div>

                                <svg width="clamp(80px, 15vw, 120px)" height="clamp(35px, 7vw, 55px)" viewBox="0 0 100 40" style={{ filter: 'drop-shadow(0 0 25px var(--primary-glow))' }}>
                                    <path d="M5,30 L95,30 L92,12 L70,6 L30,6 L8,12 Z" fill="#0052ff" /> 
                                    <path d="M30,6 L70,6 L65,15 L35,15 Z" fill="rgba(255,255,255,0.3)" />
                                    <circle cx="22" cy="30" r="7" fill="#000" />
                                    <circle cx="78" cy="30" r="7" fill="#000" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(30px, 8vw, 80px)', marginTop: '40px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: '900', color: 'var(--primary-glow)', lineHeight: 1 }}>{Math.round(progress * 100)}%</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '3px', marginTop: '10px' }}>Velocity</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: '900', color: 'var(--success-glow)', lineHeight: 1 }}>{completedCount}<small style={{fontSize: 'clamp(1rem, 3vw, 1.5rem)', opacity: 0.5}}>/{todos.length}</small></div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '3px', marginTop: '10px' }}>Laps</div>
                    </div>
                </div>
            </div>

            {/* --- Cockpit Input --- */}
            <form onSubmit={addTodo} className="cockpit-input-group" style={{ marginBottom: '40px' }}>
                <input 
                    type="text" 
                    value={newTodo} 
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="DEFINE NEXT MISSION..."
                />
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="LOW">ECO</option>
                    <option value="MEDIUM">SPORT</option>
                    <option value="HIGH">NITRO</option>
                </select>
                <button type="submit" className="btn-primary">
                    {isIgniting ? '✓' : 'START'}
                </button>
            </form>

            {/* --- Mission Grid --- */}
            <div className="todo-grid">
                {todos.map(todo => (
                    <div 
                        key={todo.id} 
                        className={`todo-item glass-panel ${todo.completed ? 'completed' : ''}`} 
                        style={{ 
                            padding: 'clamp(25px, 4vw, 35px)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 'clamp(15px, 3vw, 30px)',
                            cursor: 'pointer',
                            borderLeft: `clamp(8px, 1vw, 12px) solid ${getPriorityColor(todo.priority)}`
                        }} 
                        onClick={() => toggleTodo(todo)}
                    >
                        <div className={`orb-checkbox ${todo.completed ? 'checked' : ''}`} style={{ width: 'clamp(28px, 5vw, 36px)', height: 'clamp(28px, 5vw, 36px)' }}>
                            {todo.completed && <span style={{ color: '#fff', fontSize: '1.2rem' }}>✓</span>}
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ 
                                fontWeight: '800', 
                                fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                                textDecoration: todo.completed ? 'line-through' : 'none', 
                                color: todo.completed ? 'var(--text-muted)' : 'var(--text-main)',
                                transition: 'color 0.3s ease'
                            }}>
                                {todo.text}
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '900', color: getPriorityColor(todo.priority), marginTop: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {todo.priority} ENGINE LOAD
                            </div>
                        </div>

                        <button 
                            onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }} 
                            style={{ background: 'none', border: 'none', color: 'var(--danger-glow)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', padding: '0 10px', opacity: 0.6 }}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TodoList;