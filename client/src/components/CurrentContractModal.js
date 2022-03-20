import ReactModal from "react-modal";

ReactModal.setAppElement("#root");

function CurrentContractModal(props) {
  const currentContract = props.currentContract;
  return (
    <ReactModal isOpen={currentContract != null}>
      <p>currentContract</p>
    </ReactModal>
  );
}

export default CurrentContractModal;
