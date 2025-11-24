import './SyncOverlay.css'

export function SyncOverlay({ isVisible, status, onComplete }) {
  if (!isVisible) return null

  return (
    <div className="sync-overlay">
      <div className="sync-overlay-content">
        {status === 'loading' && (
          <>
            <div className="sync-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <h3 className="sync-title">Sincronizando dados...</h3>
            <p className="sync-description">
              Aguarde enquanto carregamos os dados do servidor
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="sync-success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3 className="sync-title">Sincronização concluída!</h3>
            <p className="sync-description">
              Os dados foram carregados com sucesso
            </p>
            <button 
              className="sync-continue-button"
              onClick={onComplete}
            >
              Continuar
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="sync-error-icon">
              <i className="fas fa-exclamation-circle"></i>
            </div>
            <h3 className="sync-title">Erro na sincronização</h3>
            <p className="sync-description">
              Ocorreu um erro ao carregar os dados. Tente novamente.
            </p>
            <button 
              className="sync-continue-button"
              onClick={onComplete}
            >
              Fechar
            </button>
          </>
        )}
      </div>
    </div>
  )
}

