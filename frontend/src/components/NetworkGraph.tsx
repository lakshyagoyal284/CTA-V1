import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GraphNode, GraphEdge } from '../types';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw, Search } from 'lucide-react';

interface NetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId?: string | null;
  onNodeSelect?: (node: GraphNode | null) => void;
  height?: number | string;
}

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onNodeSelect,
  height = 540
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragNode, setDragNode] = useState<SimNode | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dashOffset, setDashOffset] = useState(0);

  // Initialize nodes with distributed circular layout
  useEffect(() => {
    const w = 900;
    const h = 540;
    const center = { x: w / 2, y: h / 2 };
    const count = nodes.length || 1;

    const initialized: SimNode[] = nodes.map((node, i) => {
      // Group complaints slightly inner, entities slightly outer
      const isComp = node.type === 'COMPLAINT';
      const angle = (i / count) * 2 * Math.PI;
      const radius = isComp ? 140 + (i % 3) * 30 : 230 + (i % 4) * 25;
      return {
        ...node,
        x: center.x + radius * Math.cos(angle) + (Math.random() - 0.5) * 40,
        y: center.y + radius * Math.sin(angle) + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0
      };
    });

    setSimNodes(initialized);
  }, [nodes]);

  // Physics force layout simulation step
  useEffect(() => {
    let animId: number;
    let iterations = 0;
    const maxIterations = 200;

    const simulate = () => {
      setSimNodes(prevNodes => {
        if (!prevNodes.length) return prevNodes;

        const updated = prevNodes.map(n => ({ ...n }));
        const w = 900;
        const h = 540;
        const center = { x: w / 2, y: h / 2 };

        // 1. Repulsion between all nodes
        for (let i = 0; i < updated.length; i++) {
          for (let j = i + 1; j < updated.length; j++) {
            const dx = updated[j].x - updated[i].x;
            const dy = updated[j].y - updated[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = (updated[i].radius + updated[j].radius) * 2.8;

            if (dist < 320) {
              const force = (320 - dist) / 320 * 1.5;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              updated[i].vx -= fx;
              updated[i].vy -= fy;
              updated[j].vx += fx;
              updated[j].vy += fy;
            }
          }
        }

        // 2. Attraction along edges
        edges.forEach(edge => {
          const s = updated.find(n => n.id === edge.source);
          const t = updated.find(n => n.id === edge.target);
          if (s && t) {
            const dx = t.x - s.x;
            const dy = t.y - s.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const idealDist = edge.edge_type === 'DIRECT_MATCH' ? 140 : 180;
            const force = (dist - idealDist) * 0.008;

            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            s.vx += fx;
            s.vy += fy;
            t.vx -= fx;
            t.vy -= fy;
          }
        });

        // 3. Weak pull to center
        updated.forEach(n => {
          const cdx = center.x - n.x;
          const cdy = center.y - n.y;
          n.vx += cdx * 0.002;
          n.vy += cdy * 0.002;

          // Apply velocity with damping
          n.x += n.vx * 0.85;
          n.y += n.vy * 0.85;
          n.vx *= 0.7;
          n.vy *= 0.7;
        });

        return updated;
      });

      iterations++;
      if (iterations < maxIterations) {
        animId = requestAnimationFrame(simulate);
      }
    };

    animId = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animId);
  }, [edges]);

  // Edge dash animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setDashOffset(prev => (prev + 1) % 16);
    }, 60);
    return () => clearInterval(interval);
  }, []);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw Background Grid Dots
    ctx.fillStyle = 'rgba(148, 163, 184, 0.07)';
    const gridSize = 40;
    const startX = -pan.x / zoom;
    const startY = -pan.y / zoom;
    const endX = startX + width / zoom;
    const endY = startY + height / zoom;

    for (let x = Math.floor(startX / gridSize) * gridSize; x < endX; x += gridSize) {
      for (let y = Math.floor(startY / gridSize) * gridSize; y < endY; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const nodeMap = new Map<string, SimNode>();
    simNodes.forEach(n => nodeMap.set(n.id, n));

    // Draw Edges
    edges.forEach(edge => {
      const s = nodeMap.get(edge.source);
      const t = nodeMap.get(edge.target);
      if (!s || !t) return;

      const isDirect = edge.edge_type === 'DIRECT_MATCH';
      const isFinancial = edge.edge_type === 'FINANCIAL_FLOW';

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);

      if (isDirect) {
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(244, 63, 94, 0.5)';
        ctx.shadowBlur = 8;
        ctx.setLineDash([]);
      } else if (isFinancial) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.0;
        ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
        ctx.shadowBlur = 6;
        ctx.setLineDash([]);
      } else {
        // Multi-hop / Indirect
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = 'rgba(217, 119, 6, 0.4)';
        ctx.shadowBlur = 5;
        ctx.setLineDash([6, 4]);
        ctx.lineDashOffset = -dashOffset;
      }

      ctx.stroke();
      ctx.restore();

      // Edge label on midpoint for key syndicate links
      if (isDirect && edge.label) {
        const mx = (s.x + t.x) / 2;
        const my = (s.y + t.y) / 2;

        ctx.save();
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(mx - 36, my - 9, 72, 18, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(edge.label, mx, my);
        ctx.restore();
      }
    });

    // Draw Nodes
    simNodes.forEach(node => {
      const isSelected = selectedNodeId === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isFocus = node.is_focus;
      const matchesSearch = searchQuery && (
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.full_value && node.full_value.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      ctx.save();

      // Pulsing outer aura for selected / focus nodes
      if (isSelected || isFocus || matchesSearch) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
        ctx.fillStyle = isFocus ? 'rgba(236, 72, 153, 0.25)' : 'rgba(56, 189, 248, 0.3)';
        ctx.fill();
        ctx.strokeStyle = isFocus ? '#ec4899' : '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Main Node Body
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.color || '#38bdf8';
      ctx.shadowColor = node.color;
      ctx.shadowBlur = isHovered ? 16 : 8;
      ctx.fill();

      // Inner stroke
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.stroke();

      // Recurrent Indicator Badge (count badge)
      if (node.frequency && node.frequency > 1) {
        ctx.beginPath();
        ctx.arc(node.x + node.radius * 0.7, node.y - node.radius * 0.7, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(node.frequency), node.x + node.radius * 0.7, node.y - node.radius * 0.7);
      }

      // Node Label Text
      ctx.shadowBlur = 0;
      ctx.font = node.type === 'COMPLAINT' ? '600 11px Outfit, sans-serif' : '500 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const label = node.label || node.id;
      const textWidth = ctx.measureText(label).width;

      // Label background pill
      ctx.fillStyle = 'rgba(10, 15, 29, 0.85)';
      ctx.beginPath();
      ctx.roundRect(node.x - textWidth / 2 - 4, node.y + node.radius + 4, textWidth + 8, 16, 4);
      ctx.fill();

      ctx.fillStyle = isSelected ? '#38bdf8' : '#f8fafc';
      ctx.fillText(label, node.x, node.y + node.radius + 6);

      ctx.restore();
    });

    ctx.restore();
  }, [simNodes, edges, zoom, pan, selectedNodeId, hoveredNode, searchQuery, dashOffset]);

  // Mouse interaction handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    // Check if clicked a node
    const clicked = simNodes.find(n => {
      const dist = Math.hypot(n.x - mouseX, n.y - mouseY);
      return dist <= n.radius + 4;
    });

    if (clicked) {
      setDragNode(clicked);
      if (onNodeSelect) onNodeSelect(clicked);
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      if (onNodeSelect) onNodeSelect(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (dragNode) {
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      setSimNodes(prev => prev.map(n => n.id === dragNode.id ? { ...n, x: mouseX, y: mouseY, vx: 0, vy: 0 } : n));
    } else if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else {
      // Hover test
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      const hovered = simNodes.find(n => Math.hypot(n.x - mouseX, n.y - mouseY) <= n.radius + 4) || null;
      setHoveredNode(hovered);
      canvas.style.cursor = hovered ? 'pointer' : 'default';
    }
  };

  const handleMouseUp = () => {
    setDragNode(null);
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(z => Math.max(0.4, Math.min(2.5, z * zoomFactor)));
  };

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Top Toolbar Controls */}
      <div style={{
        position: 'absolute',
        top: 14,
        left: 14,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(10, 15, 29, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: '6px 10px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
      }}>
        <Search size={14} color="var(--text-dim)" />
        <input
          type="text"
          placeholder="Filter node or indicator..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#f8fafc',
            fontSize: '0.8rem',
            width: 170
          }}
        />
      </div>

      <div style={{
        position: 'absolute',
        top: 14,
        right: 14,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(10, 15, 29, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: '6px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
      }}>
        <button
          onClick={() => setZoom(z => Math.min(2.5, z * 1.15))}
          className="btn-secondary"
          style={{ padding: '6px 8px' }}
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.4, z * 0.85))}
          className="btn-secondary"
          style={{ padding: '6px 8px' }}
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={resetZoom}
          className="btn-secondary"
          style={{ padding: '6px 8px' }}
          title="Reset View"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={960}
        height={typeof height === 'number' ? height : 540}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          width: '100%',
          height,
          background: 'radial-gradient(ellipse at center, #0d1527 0%, #070b14 100%)',
          display: 'block'
        }}
      />

      {/* Floating Bottom Legend */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        left: 14,
        right: 14,
        zIndex: 10,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(10, 15, 29, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: '8px 14px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        fontSize: '0.74rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#38bdf8' }} />
            <span style={{ color: 'var(--text-muted)' }}>Complaint Case</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#a855f7' }} />
            <span style={{ color: 'var(--text-muted)' }}>UPI VPA</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: '#f59e0b' }} />
            <span style={{ color: 'var(--text-muted)' }}>Phone Number</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} />
            <span style={{ color: 'var(--text-muted)' }}>Bank Account</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f43f5e' }} />
            <span style={{ color: 'var(--text-muted)' }}>Phishing URL</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 20, height: 2, background: '#f43f5e' }} />
            <span style={{ color: '#f43f5e', fontWeight: 600 }}>Direct Link (1-Hop)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 20, height: 2, borderTop: '2px dashed #d97706' }} />
            <span style={{ color: '#d97706', fontWeight: 600 }}>Inferred (Multi-Hop)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 20, height: 2, background: '#10b981' }} />
            <span style={{ color: '#10b981', fontWeight: 600 }}>Financial Flow</span>
          </div>
        </div>
      </div>
    </div>
  );
};
