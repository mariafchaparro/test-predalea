'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { createClient } from '@/utils/supabase/client';
import type { Mercado } from '@/utils/types';

export default function MercadosPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [mercados, setMercados] = useState<Mercado[]>([]);

  // Formularios y Vistas Modales
  const [modalEditar, setModalEditar] = useState<Mercado | null>(null);
  const [modalEliminar, setModalEliminar] = useState<Mercado | null>(null);

  // Estados del Formulario de Creación Activo
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [nuevaDesc, setNuevaDesc] = useState('');
  const [nuevaImagenFile, setNuevaImagenFile] = useState<File | null>(null);
  const [creando, setCreando] = useState(false);

  // Estados del Formulario de Edición Activo
  const [editTitulo, setEditTitulo] = useState('');
  const [editCategoria, setEditCategoria] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editImagenUrl, setEditImagenUrl] = useState('');
  const [editImagenFile, setEditImagenFile] = useState<File | null>(null);
  const [editPrecioSi, setEditPrecioSi] = useState(0.5);
  const [editPrecioNo, setEditPrecioNo] = useState(0.5);
  const [editFinalizado, setEditFinalizado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const fetchMercados = async () => {
    setLoading(true);
    const { data } = await supabase.from('mercados').select('*').order('id', { ascending: false });
    if (data) setMercados(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMercados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
    const { data: uploadData, error } = await supabase.storage.from('mercados').upload(fileName, file);
    if (error) {
      console.error('Error uploading image', error);
      return null;
    }
    const { data } = supabase.storage.from('mercados').getPublicUrl(uploadData.path);
    return data.publicUrl;
  };

  const handleCrear = async () => {
    if (!nuevoTitulo.trim() || !nuevaCategoria.trim()) return;
    setCreando(true);
    
    let urlImagen = 'http://127.0.0.1:54321/storage/v1/object/public/mercados/placeholder.png';
    if (nuevaImagenFile) {
      const publicUrl = await handleImageUpload(nuevaImagenFile);
      if (publicUrl) urlImagen = publicUrl;
    }

    const rndPrecio = 0.5;

    const { data, error } = await supabase.from('mercados').insert([{
      titulo: nuevoTitulo,
      categoria: nuevaCategoria,
      descripcion: nuevaDesc,
      imagen_url: urlImagen,
      precio_si: rndPrecio,
      precio_no: rndPrecio,
      finalizado: false
    }]).select();

    if (!error && data) {
      setMercados([data[0], ...mercados]);
      setNuevoTitulo('');
      setNuevaCategoria('');
      setNuevaDesc('');
      setNuevaImagenFile(null);
    }
    setCreando(false);
  };

  const abrirEditar = (mercado: Mercado) => {
    setEditTitulo(mercado.titulo);
    setEditCategoria(mercado.categoria || '');
    setEditDesc(mercado.descripcion || '');
    setEditImagenUrl(mercado.imagen_url || '');
    setEditImagenFile(null);
    setEditPrecioSi(mercado.precio_si);
    setEditPrecioNo(mercado.precio_no);
    setEditFinalizado(mercado.finalizado);
    setModalEditar(mercado);
  };

  const handleGuardarEdicion = async () => {
    if (!modalEditar) return;
    setGuardando(true);
    
    let urlImagen = editImagenUrl;
    if (editImagenFile) {
      const publicUrl = await handleImageUpload(editImagenFile);
      if (publicUrl) urlImagen = publicUrl;
    }

    const { error } = await supabase.from('mercados').update({
      titulo: editTitulo,
      categoria: editCategoria,
      descripcion: editDesc,
      imagen_url: urlImagen,
      precio_si: editPrecioSi,
      precio_no: editPrecioNo,
      finalizado: editFinalizado,
    }).eq('id', modalEditar.id);

    if (!error) {
      setMercados(mercados.map((m) => m.id === modalEditar.id ? {
        ...m,
        titulo: editTitulo,
        categoria: editCategoria,
        descripcion: editDesc,
        imagen_url: urlImagen,
        precio_si: editPrecioSi,
        precio_no: editPrecioNo,
        finalizado: editFinalizado
      } : m));
      setModalEditar(null);
    }
    setGuardando(false);
  };

  const handleEliminar = async () => {
    if (!modalEliminar) return;
    setEliminando(true);

    const { error } = await supabase.from('mercados').delete().eq('id', modalEliminar.id);

    if (!error) {
      setMercados(mercados.filter((m) => m.id !== modalEliminar.id));
      setModalEliminar(null);
    }
    setEliminando(false);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 relative">
      <Header />

      <div className="flex-1 overflow-y-auto pb-32 bg-white">
        
        {/* -- SECTION: AÑADIR NUEVO MERCADO -- */}
        <div className="px-5 py-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Añadir Nuevo Mercado</h2>
          
          <div className="flex flex-col gap-4">
            {/* Título */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-slate-400 tracking-[1.2px] uppercase">Título</label>
              <input 
                type="text" 
                value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)}
                placeholder="ej. ¿Llegará Bitcoin a $100k?"
                className="bg-slate-50 w-full px-4 py-3 rounded-2xl text-sm text-slate-900 outline-none border border-transparent focus:border-slate-200 transition-colors"
              />
            </div>
            
            {/* Categoría */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-slate-400 tracking-[1.2px] uppercase">Categoría</label>
              <input 
                type="text" 
                value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)}
                placeholder="Categoría a la que pertenece (Ej. Finanzas, Política)"
                className="bg-slate-50 w-full px-4 py-3 rounded-2xl text-sm text-slate-900 outline-none border border-transparent focus:border-slate-200 transition-colors"
              />
            </div>

            {/* Descripción */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-slate-400 tracking-[1.2px] uppercase">Descripción</label>
              <textarea 
                value={nuevaDesc} onChange={(e) => setNuevaDesc(e.target.value)}
                placeholder="Proporciona contexto para este mercado de predicción..."
                className="bg-slate-50 w-full px-4 py-3 rounded-2xl text-sm text-slate-900 outline-none h-24 resize-none border border-transparent focus:border-slate-200 transition-colors"
              />
            </div>

            {/* Drag & Drop Imagen */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-slate-400 tracking-[1.2px] uppercase">Imagen del Mercado</label>
              <div 
                className="bg-[rgba(248,250,252,0.5)] border-2 border-slate-200 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors relative"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setNuevaImagenFile(e.dataTransfer.files[0]);
                  }
                }}
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNuevaImagenFile(e.target.files[0]);
                    }
                  }}
                />
                {nuevaImagenFile ? (
                  <div className="flex flex-col items-center pointer-events-none">
                    <img src={URL.createObjectURL(nuevaImagenFile)} alt="Previsualización" className="w-[124px] h-[124px] object-cover rounded-xl mb-3 shadow" />
                    <span className="text-xs font-bold text-[#2e5cff]">{nuevaImagenFile.name} (Toca para cambiar)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center pointer-events-none">
                    <svg className="w-8 h-8 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    <p className="text-sm font-medium text-slate-600">Arrastra y suelta o toca para subir</p>
                    <p className="text-[11px] text-slate-400 mt-1">PNG, JPG hasta 5MB</p>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={handleCrear} disabled={creando}
              className="mt-2 w-full bg-[#2e5cff] text-white font-bold text-[14px] py-4 rounded-2xl border-none cursor-pointer hover:opacity-90 transition-opacity flex justify-center items-center disabled:opacity-50"
            >
              {creando ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Creando Mercado...
                </>
              ) : 'Crear Mercado'}
            </button>
          </div>
        </div>

        <div className="h-px bg-slate-100 mx-5" />

        {/* -- SECTION: LISTA DE MERCADOS ACTIVOS -- */}
        <div className="px-5 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 leading-tight">Lista de Mercados<br/>Activos</h2>
            <div className="bg-slate-100 text-slate-400 text-xs font-semibold px-3 py-1.5 rounded-full">
              Total: {mercados.length}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="text-sm text-slate-400">Cardando mercados...</div>
            ) : mercados.map((m) => (
              <div key={m.id} className="bg-white border border-slate-100 p-5 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col gap-4">
                
                {/* Title & Actions */}
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-bold text-[15px] text-slate-900 leading-snug flex-1">{m.titulo}</h3>
                  <div className="flex gap-2 shrink-0">
                    {/* Botón Editar */}
                    <button 
                      onClick={() => abrirEditar(m)}
                      className="size-8 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center border-none cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                    {/* Botón Borrar */}
                    <button 
                      onClick={() => setModalEliminar(m)}
                      className="size-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center border-none cursor-pointer hover:bg-red-100 transition-colors"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>
                </div>

                {/* Precios Sí / No */}
                <div className="flex gap-4">
                  <div className="flex-1 bg-slate-50 rounded-2xl p-3 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[-0.5px]">Precio Sí</span>
                    <span className="text-[14px] font-bold text-slate-900">{m.precio_si.toFixed(2)}</span>
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-2xl p-3 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[-0.5px]">Precio No</span>
                    <span className="text-[14px] font-bold text-slate-900">{m.precio_no.toFixed(2)}</span>
                  </div>
                </div>

                {/* Status bar */}
                <div className="pt-5 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[12px] font-semibold text-slate-500">Estado: {m.finalizado ? 'Finalizado' : 'Activo'}</span>
                  {/* Toggle UI pill */}
                  <div className={`w-11 h-6 rounded-full relative ${m.finalizado ? 'bg-[#2e5cff]' : 'bg-slate-200'}`}>
                    <div className={`absolute top-0.5 size-5 rounded-full bg-white border border-slate-200 transition-all ${m.finalizado ? 'left-[22px] border-white' : 'left-[2px]'}`} />
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ─── MODAL: EDITAR MERCADO ─── */}
      {modalEditar && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center max-w-[600px] left-1/2 -translate-x-1/2 w-full mx-auto">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalEditar(null)} />

          {/* Modal Container */}
          <div className="w-full h-[90vh] sm:h-auto sm:max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl relative flex flex-col z-10 animate-fade-in-up">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 pt-5 pb-5 border-b border-slate-50 shrink-0">
              <h2 className="text-[20px] font-bold text-slate-900">Editar Mercado</h2>
              <button 
                onClick={() => setModalEditar(null)}
                className="bg-transparent border-none text-slate-400 cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Content scrollable */}
            <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
              <div className="flex flex-col gap-1.5 focus-within:text-slate-900">
                <label className="text-[11px] font-bold text-slate-400 tracking-[1.1px] uppercase">Título</label>
                <input type="text" value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)}
                  className="bg-slate-50 w-full px-4 py-3 rounded-2xl text-[14px] font-medium text-slate-900 outline-none" />
              </div>
              <div className="flex flex-col gap-1.5 focus-within:text-slate-900">
                <label className="text-[11px] font-bold text-slate-400 tracking-[1.1px] uppercase">Categoría</label>
                <input type="text" value={editCategoria} onChange={(e) => setEditCategoria(e.target.value)}
                  className="bg-slate-50 w-full px-4 py-3 rounded-2xl text-[14px] text-slate-900 outline-none" />
              </div>
              <div className="flex flex-col gap-1.5 focus-within:text-slate-900">
                <label className="text-[11px] font-bold text-slate-400 tracking-[1.1px] uppercase">Descripción</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                  className="bg-slate-50 w-full px-4 py-3 rounded-2xl text-[14px] text-slate-900 outline-none h-24 resize-none" />
              </div>

              {/* Drag & Drop Imagen (Edición) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 tracking-[1.1px] uppercase">Imagen del Mercado</label>
                <div 
                  className="bg-slate-50 rounded-2xl p-4 flex gap-4 items-center cursor-pointer hover:bg-slate-100 transition-colors relative"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setEditImagenFile(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setEditImagenFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="size-16 rounded-xl overflow-hidden shrink-0 bg-slate-200 shadow pointer-events-none">
                    {editImagenFile ? (
                      <img src={URL.createObjectURL(editImagenFile)} alt="Previsualización" className="w-full h-full object-cover" />
                    ) : editImagenUrl ? (
                      <img src={editImagenUrl} alt="Original" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">📊</div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center pointer-events-none">
                    <span className="text-[12px] font-bold text-[#2e5cff]">Cambiar imagen</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{editImagenFile ? editImagenFile.name : 'Toca o arrastra un nuevo archivo'}</span>
                  </div>
                </div>
              </div>

              {/* Precios Row */}
              <div className="flex gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[11px] font-bold text-slate-400 tracking-[1.1px] uppercase">Precio SÍ</label>
                  <div className="bg-slate-50 px-4 py-3 rounded-2xl flex justify-between items-center text-sm font-bold text-slate-900">
                    <input type="number" step="0.01" min="0" max="1" value={editPrecioSi} onChange={(e) => setEditPrecioSi(parseFloat(e.target.value))} className="bg-transparent font-bold w-12 outline-none" />
                    <span className="text-slate-400 font-normal">$</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[11px] font-bold text-slate-400 tracking-[1.1px] uppercase">Precio NO</label>
                  <div className="bg-slate-50 px-4 py-3 rounded-2xl flex justify-between items-center text-sm font-bold text-slate-900">
                    <input type="number" step="0.01" min="0" max="1" value={editPrecioNo} onChange={(e) => setEditPrecioNo(parseFloat(e.target.value))} className="bg-transparent font-bold w-12 outline-none" />
                    <span className="text-slate-400 font-normal">$</span>
                  </div>
                </div>
              </div>

              {/* Toggle finalizado */}
              <div className="flex justify-between items-center py-2 mt-2">
                <div>
                  <h4 className="text-[14px] font-bold text-slate-900">Finalizado</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">El mercado ya no aceptará más apuestas</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditFinalizado(!editFinalizado)}
                  className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer border-none outline-none ${editFinalizado ? 'bg-[#2e5cff]' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-[2px] size-5 rounded-full bg-white shadow-sm transition-all ${editFinalizado ? 'left-[22px]' : 'left-[2px]'}`} />
                </button>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="px-6 py-6 pb-8 sm:pb-6 bg-white shrink-0">
              <button onClick={handleGuardarEdicion} disabled={guardando}
                className="w-full bg-[#2e5cff] text-white py-4 rounded-2xl text-[14px] font-bold border-none cursor-pointer hover:opacity-90 disabled:opacity-50 transition-opacity mb-3 flex justify-center items-center">
                {guardando ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Guardando...
                  </>
                ) : 'Guardar Cambios'}
              </button>
              <button onClick={() => setModalEditar(null)}
                className="w-full bg-transparent text-slate-400 py-1 rounded-2xl text-[14px] font-semibold border-none cursor-pointer hover:text-slate-600 transition-colors">
                Cancelar
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* ─── MODAL: ELIMINAR MERCADO ─── */}
      {modalEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 max-w-[600px] left-1/2 -translate-x-1/2 w-full mx-auto">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalEliminar(null)} />
          
          {/* Card */}
          <div className="w-full max-w-[320px] bg-white rounded-[28px] shadow-2xl relative z-10 flex flex-col items-center animate-fade-in-up">
            
            <div className="w-full px-6 pt-8 pb-6 flex flex-col items-center">
              {/* Trash Icon Circle */}
              <div className="size-[64px] bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </div>

              <h3 className="text-[20px] font-bold text-slate-900 mb-3 font-sans w-full text-center">¿Eliminar Mercado?</h3>
              
              <p className="text-[14px] text-slate-500 text-center leading-[22px]">
                Esta acción no se puede deshacer. Se eliminarán todos los datos asociados a este mercado.
              </p>
            </div>

            <div className="w-full px-6 pb-8 flex flex-col gap-3">
              <button 
                onClick={handleEliminar} disabled={eliminando}
                className="w-full bg-[#2e5cff] text-white py-[14px] rounded-2xl text-[15px] font-bold border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
              <button 
                onClick={() => setModalEliminar(null)}
                className="w-full bg-transparent text-slate-400 py-1 rounded-2xl text-[14px] font-semibold border-none cursor-pointer hover:text-slate-600 transition-colors"
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
