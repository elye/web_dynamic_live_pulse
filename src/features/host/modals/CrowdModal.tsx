import { ArrowRight } from "lucide-react";
import { Modal } from "../../../components/Modal";
import { crowdGroups, icons, kindHints } from "../../../constants/kinds";
import { labels } from "../../../model";
import { useHost } from "../HostContext";

export function CrowdModal() {
  const { setModal, busy, startCrowdSession } = useHost();
  return (
    <Modal title="What should players write?" onClose={() => setModal(null)}>
      <p className="muted crowd-intro">
        Players join, then each writes one question of the type you pick. The
        questions are played in random order, each one showing who wrote it.
      </p>
      {crowdGroups.map((group) => (
        <section className="question-group" key={group.title}>
          <h3>{group.title}</h3>
          <div className="question-types">
            {group.kinds.map((kind) => {
              const Icon = icons[kind];
              return (
                <button
                  key={kind}
                  disabled={busy}
                  onClick={() => {
                    setModal(null);
                    void startCrowdSession(kind);
                  }}
                >
                  <span className={`type-icon type-${kind}`}>
                    <Icon size={25} />
                  </span>
                  <span>
                    <strong>{labels[kind]}</strong>
                    <small>{kindHints[kind]}</small>
                  </span>
                  <ArrowRight size={19} />
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </Modal>
  );
}
