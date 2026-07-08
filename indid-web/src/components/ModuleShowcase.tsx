/**

 * 引擎模块交互文档

 * 左侧模块目录，右侧上区介绍+代码、下区交互演示

 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { GameCanvas } from './GameCanvas';

import {

  MODULE_DEFINITIONS,

  getDefaultToggles,

  getModuleById,

} from './moduleShowcase/moduleShowcaseData';

import { runModuleDemo } from './moduleShowcase/moduleDemos';
import { useDemoCanvasSize } from './moduleShowcase/useDemoCanvasSize';

import './ModuleShowcase.css';



const CANVAS_ID = 'moduleShowcaseCanvas';



const ModuleShowcase = () => {

  const [activeId, setActiveId] = useState(MODULE_DEFINITIONS[0].id);

  const [canvasReady, setCanvasReady] = useState(false);

  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>

    getDefaultToggles(MODULE_DEFINITIONS[0])

  );

  const [status, setStatus] = useState('');

  const [demoLoading, setDemoLoading] = useState(false);



  const togglesRef = useRef(toggles);
  const stageRef = useRef<HTMLDivElement>(null);
  const demoCanvasSize = useDemoCanvasSize(stageRef);

  togglesRef.current = toggles;



  const activeModule = getModuleById(activeId) ?? MODULE_DEFINITIONS[0];



  const handleCanvasReady = useCallback(() => setCanvasReady(true), []);



  const handleModuleSelect = (id: string) => {

    const mod = getModuleById(id);

    if (!mod || id === activeId) return;

    setActiveId(id);

    setToggles(getDefaultToggles(mod));

    setStatus('');

  };



  const handleToggle = (toggleId: string) => {

    setToggles((prev) => ({ ...prev, [toggleId]: !prev[toggleId] }));

  };



  useEffect(() => {

    if (!canvasReady || !activeModule.hasCanvasDemo) return;



    let cleanup: (() => void) | null = null;

    let cancelled = false;

    setDemoLoading(true);



    const ctx = {

      canvasId: CANVAS_ID,

      getToggle: (id: string) => togglesRef.current[id] ?? false,

      setStatus: (text: string) => {

        if (!cancelled) setStatus(text);

      },

    };



    cleanup = runModuleDemo(activeId, ctx);

    if (!cancelled) setDemoLoading(false);



    return () => {

      cancelled = true;

      cleanup?.();

    };

  }, [
    canvasReady,
    activeId,
    activeModule.hasCanvasDemo,
    demoCanvasSize.width,
    demoCanvasSize.height,
  ]);



  return (

    <div className="module-showcase">

      <aside className="module-showcase__sidebar">

        <header className="module-showcase__sidebar-header">

          <h1 className="module-showcase__title">引擎模块文档</h1>

          <p className="module-showcase__subtitle">NoteElec 2D · 交互式 API 演示</p>

        </header>

        <nav className="module-showcase__nav" aria-label="引擎模块">

          {MODULE_DEFINITIONS.map((mod) => (

            <button

              key={mod.id}

              type="button"

              className={`module-showcase__nav-item${mod.id === activeId ? ' is-active' : ''}`}

              onClick={() => handleModuleSelect(mod.id)}

              aria-current={mod.id === activeId ? 'page' : undefined}

            >

              <span className="module-showcase__nav-label">{mod.title}</span>

              <span className="module-showcase__nav-path">{mod.path}</span>

            </button>

          ))}

        </nav>

      </aside>



      <main className="module-showcase__main">

        <section

          key={`doc-${activeId}`}

          className="module-showcase__doc module-showcase__panel-enter"

          aria-label="模块介绍与代码示例"

        >

          <div className="module-showcase__doc-top">

            <div className="module-showcase__section-label">模块介绍</div>

            <div className="module-showcase__doc-header">

              <h2 className="module-showcase__module-title">{activeModule.title}</h2>

              <code className="module-showcase__module-path">{activeModule.path}</code>

            </div>

            <p className="module-showcase__intro module-showcase__stagger-1">

              {activeModule.intro}

            </p>



            <div className="module-showcase__section-label module-showcase__stagger-2">

              代码示例

            </div>

          </div>

          <div className="module-showcase__code-scroll module-showcase__stagger-3">

            <pre className="module-showcase__code">

              <code>{activeModule.code}</code>

            </pre>

          </div>

        </section>



        <div className="module-showcase__divider" aria-hidden="true" />



        <section

          key={`demo-${activeId}`}

          className="module-showcase__demo module-showcase__panel-enter-delayed"

          aria-label="交互示例"

        >

          <div className="module-showcase__demo-controls">

            <div className="module-showcase__demo-header">

              <h3 className="module-showcase__demo-title">交互示例</h3>

              {demoLoading && activeModule.hasCanvasDemo && (

                <span className="module-showcase__loading-badge">加载中…</span>

              )}

            </div>



            {activeModule.toggles.length > 0 && (

              <div className="module-showcase__toggles">

                {activeModule.toggles.map((toggle, index) => {

                  const checked = toggles[toggle.id] ?? toggle.defaultValue;

                  return (

                    <label

                      key={toggle.id}

                      className="module-showcase__switch"

                      style={{ animationDelay: `${0.1 + index * 0.06}s` }}

                    >

                      <input

                        type="checkbox"

                        className="module-showcase__switch-input"

                        checked={checked}

                        onChange={() => handleToggle(toggle.id)}

                      />

                      <span className="module-showcase__switch-track" aria-hidden="true">

                        <span className="module-showcase__switch-thumb" />

                      </span>

                      <span className="module-showcase__switch-label">{toggle.label}</span>

                    </label>

                  );

                })}

              </div>

            )}



            {status && activeModule.hasCanvasDemo && (

              <p className="module-showcase__status">{status}</p>

            )}

          </div>



          <div className="module-showcase__stage" ref={stageRef}>

            {activeModule.hasCanvasDemo ? (

              <div className="module-showcase__canvas-wrap">

                <div
                  className="module-showcase__canvas-host"
                  style={{
                    width: demoCanvasSize.width,
                    height: demoCanvasSize.height,
                  }}
                >

                  <GameCanvas

                    id={CANVAS_ID}

                    width={demoCanvasSize.width}

                    height={demoCanvasSize.height}

                    className="module-showcase__canvas"

                    onReady={handleCanvasReady}

                  />

                </div>

              </div>

            ) : (

              <div className="module-showcase__no-demo">

                <p>AudioManager 为可选模块，此处仅展示 API 说明。</p>

                <p className="module-showcase__no-demo-hint">

                  浏览器可能拦截自动播放；嵌入游戏时可按需调用 playSFX / playBGM。

                </p>

              </div>

            )}

          </div>

        </section>

      </main>

    </div>

  );

};



export { ModuleShowcase };


