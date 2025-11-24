import { Modal } from './Modal'
import './TutorialModal.css'

export function TutorialModal({ isOpen, onClose, onStartSync }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bem-vindo ao SIMS!"
      showCloseButton={false}
    >
      <div className="tutorial-content">
        <div className="tutorial-icon">
          <i className="fas fa-sync-alt"></i>
        </div>
        <h3 className="tutorial-title">Primeiro Acesso</h3>
        <p className="tutorial-description">
          Para começar a usar o dashboard, você precisa sincronizar os dados pela primeira vez.
        </p>
        <div className="tutorial-steps">
          <div className="tutorial-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <strong>Clique no ícone de sincronizar</strong>
              <span>Localizado no canto superior direito do dashboard</span>
            </div>
          </div>
          <div className="tutorial-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <strong>Aguarde o carregamento</strong>
              <span>Os dados serão carregados do servidor</span>
            </div>
          </div>
          <div className="tutorial-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <strong>Pronto para usar!</strong>
              <span>Após a sincronização, você poderá navegar pelo dashboard</span>
            </div>
          </div>
        </div>
        <div className="tutorial-actions">
          <button 
            className="tutorial-button-primary"
            onClick={onStartSync}
          >
            <i className="fas fa-sync"></i>
            Sincronizar Agora
          </button>
          <button 
            className="tutorial-button-secondary"
            onClick={onClose}
          >
            Entendi, vou sincronizar depois
          </button>
        </div>
      </div>
    </Modal>
  )
}

