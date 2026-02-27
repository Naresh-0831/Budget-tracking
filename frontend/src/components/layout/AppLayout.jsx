import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg,#0f0c29,#1a1640,#0f0c29)' }}>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content area */}
            <div className="flex flex-col flex-1 lg:ml-64 overflow-hidden">
                <Navbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
