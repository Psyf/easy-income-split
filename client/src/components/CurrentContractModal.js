import { useState, useEffect } from "react";
import ReactModal from "react-modal";

ReactModal.setAppElement("#root");

function CurrentContractModal(props) {
  const [currentContract, setCurrentContract] = useState();

  useEffect(() => {
    setCurrentContract(props.currentContract);
  }, [props]);

  return (
    <ReactModal isOpen={currentContract != null}>
      <button onClick={() => setCurrentContract(null)}>clearContract</button>
    </ReactModal>
  );
}

export default CurrentContractModal;
