import { useState, useEffect } from 'react';
import { ethers, utils } from "ethers";
import abi from "./contracts/AuditBook.json";
import { Resolver } from '@ethersproject/providers';

function App() {
  const StateTypeEnum = ['Pending', 'Approved', 'Rejected'];
  const STATE_PENDING = 0;
  const STATE_APPROVED = 1;
  const STATE_REJECTED = 2;

  const AuditStateEnum = ['Submitted', 'Approved', 'Rejected'];
  const AUDIT_STATE_SUBMITTED = 0;
  const AUDIT_STATE_APPROVED = 1;
  const AUDIT_STATE_REJECTED = 2;

  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isAuditBookOwner, setIsAuditBookOwner] = useState(false);
  const [inputValue, setInputValue] = useState({ adminName: "", auditCompanyName: "", auditableCompanyAddress: "", auditFinding: "" });
  const [auditBookOwnerAddress, setAuditBookOwnerAddress] = useState(null);
  const [currentAuditBookName, setCurrentAdminName] = useState(null);
  const [customerAddress, setCustomerAddress] = useState(null);
  const [error, setError] = useState(null);

  /* Audit Companies */
  const [isRegisteredAsAuditCompany, setIsRegisteredAsAuditCompany] = useState(false);
  const [auditCompanyCurrentState, setAuditCompanyCurrentState] = useState(null);
  const [auditCompaniesList, setAuditCompaniesList] = useState(null);
  const [submitAuditMessage, setSubmitAuditMessage] = useState(null);

  /* Auditable Companies */
  const [isRegisteredAsAuditableCompany, setIsRegisteredAsAuditableCompany] = useState(false);
  const [auditableCompanyCurrentState, setAuditableCompanyCurrentState] = useState(null);
  const [auditableCompaniesList, setAuditableCompaniesList] = useState(null);
  const [approvedAuditableCompaniesList, setApprovedAuditableCompaniesList] = useState(null);
  const [auditableCompanySubmittedAuditsList, setAuditableCompanySubmittedAuditsList] = useState(null);

  const contractAddress = '0xb09da8a5B236fE0295A345035287e80bb0008290';
  const contractABI = abi.abi;

  var provider;
  var signer;
  var auditBookContract;

  function checkMetaMask() {
    try {
      if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        auditBookContract = new ethers.Contract(contractAddress, contractABI, signer);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error)
      return false;
    }
  }

  /* Administrator */

  const checkIfWalletIsConnected = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        const account = accounts[0];
        setIsWalletConnected(true);
        setCustomerAddress(account);
        console.log("Account Connected: ", account);
      } else {
        setError("Please install a MetaMask wallet to use our dapp.");
        console.log("No Metamask detected");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const getAdminName = async () => {
    try {
      if (checkMetaMask()) {
        let adminName = await auditBookContract.adminName();
        if (adminName !== '') {
          adminName = utils.parseBytes32String(adminName);
          setCurrentAdminName(adminName.toString());
        } else {
          setCurrentAdminName('');
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  const getAuditCompaniesList = async () => {
    try {
      if (checkMetaMask()) {
        if (isAuditBookOwner) {
          let auditCompaniesList = await auditBookContract.getAuditCompanies();
          setAuditCompaniesList(auditCompaniesList);
        } else {
          setAuditCompaniesList(null);
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  const getAuditableCompaniesList = async () => {
    try {
      if (checkMetaMask()) {
        if (isAuditBookOwner) {
          let auditableCompaniesList = await auditBookContract.getAuditableCompanies();
          setAuditableCompaniesList(auditableCompaniesList);

          let approvedAuditableCompaniesList = await auditBookContract.getApprovedAuditableCompanies();
          setApprovedAuditableCompaniesList(approvedAuditableCompaniesList);
        } else {
          setAuditableCompaniesList(null);
          setApprovedAuditableCompaniesList(null);
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  const setAdminNameHandler = async (event) => {
    event.preventDefault();
    try {
      if (checkMetaMask()) {
        const txn = await auditBookContract.setAdminName(utils.formatBytes32String(inputValue.adminName));
        console.log("Setting Admin Name...");
        await txn.wait();
        console.log("Admin Name Changed", txn.hash);
        getAdminName();
      }
    } catch (error) {
      console.log(error)
    }
  }

  const getAuditBookOwnerHandler = async () => {
    try {
      if (checkMetaMask()) {
        let owner = await auditBookContract.admin();
        setAuditBookOwnerAddress(owner);

        const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });

        let isOwner = (owner.toLowerCase() === account.toLowerCase());
        setIsAuditBookOwner(isOwner);
        return isOwner
      }
    } catch (error) {
      console.log(error)
    }

    return false;
  }
 
  const approveAuditCompanyHandler = address => async () => {
    try {
      if (checkMetaMask()) {
        const txn = await auditBookContract.ApproveAuditCompany(address);
        console.log('Init approving process ...');
        await txn.wait();
        console.log('Finish approving process ...');
        getAuditCompaniesList();
        setAuditCompanyCurrentState(STATE_APPROVED);
      }
    } catch (error) {
      console.log(error)
    }
  }

  const rejectAuditCompanyHandler = address => async () => {
    try {
      if (checkMetaMask()) {
        const txn = await auditBookContract.RejectAuditCompany(address, 'Your company was rejected');
        console.log('Init rejecting process ...');
        await txn.wait();
        console.log('Finish Rejecting process ...');
        getAuditCompaniesList();
        setAuditCompanyCurrentState(STATE_REJECTED);
      }
    } catch (error) {
      console.log(error)
    }
  }

  const approveAuditableCompanyHandler = address => async () => {
    try {
      if (checkMetaMask()) {
        const txn = await auditBookContract.ApproveAuditableCompany(address);
        console.log('Init approving process ...');
        await txn.wait();
        console.log('Finish approving process ...');
        getAuditableCompaniesList();
        setAuditableCompanyCurrentState(STATE_APPROVED);
      }
    } catch (error) {
      console.log(error)
    }
  }

  const rejectAuditableCompanyHandler = address => async () => {
    try {
      if (checkMetaMask()) {
        const txn = await auditBookContract.RejectAuditableCompany(address, 'Your company was rejected');
        console.log('Init rejecting process ...');
        await txn.wait();
        console.log('Finish Rejecting process ...');
        getAuditableCompaniesList();
        setAuditableCompanyCurrentState(STATE_REJECTED);
      }
    } catch (error) {
      console.log(error)
    }
  }

  /* Audit Company */

  const checkIfAuditCompanyIsRegistered = async () => {
    try {
      if (checkMetaMask()) {
        let registered = await auditBookContract.IsRegisteredAsAuditCompany();
        setIsRegisteredAsAuditCompany(registered);

        if (registered) {
          getAuditCompanyName();
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  const getAuditCompanyName = async () => {
    try {
      if (checkMetaMask()) {
        let company = await auditBookContract.getAuditCompanyRegister();
        let companyName = utils.parseBytes32String(company.name);
        inputValue.auditCompanyName = companyName.toString();
        setAuditCompanyCurrentState(company.state);
      }
    } catch (error) {
      console.log(error)
    }
  }

  const auditCompanyRequestAdmisionHandler = async (event) => {
    event.preventDefault();
    try {
      if (checkMetaMask()) {
        const txn = await auditBookContract.AuditCompanyRequestAdmision(utils.formatBytes32String(inputValue.auditCompanyName));
        console.log("Init request admision...");
        await txn.wait();
        console.log("Finish request admision", txn.hash);
        checkIfAuditCompanyIsRegistered();
        getAuditCompaniesList();
      }
    } catch (error) {
      console.log(error)
    }
  }

  const submitAuditHandler = async (event) => {
    try {
      if (checkMetaMask()) {
        if (inputValue.auditableCompanyAddress !== "" && inputValue.auditFinding.trim() !== "") {
          const txn = await auditBookContract.SubmitAudit(inputValue.auditableCompanyAddress, utils.formatBytes32String(inputValue.auditFinding));
          console.log("Init submit audit...");
          await txn.wait();
          console.log("Finish submit audit", txn.hash);
          setSubmitAuditMessage("The finding was succesfully submited!");
          getAuditableCompanySubmittedAuditsList();
        } else {
          setSubmitAuditMessage("You have to select a company and fill the finding box");
        }        
      }
    } catch (error) {
      var errorMessage = "There was an error submitting the finding!";
      if (error.data != null) {
        errorMessage += " - Detail: " + error.data.message
      }
      setSubmitAuditMessage(errorMessage);
      console.log(error);
    }
  }

  /* Auditable Company */

  const checkIfAuditableCompanyIsRegistered = async () => {
    try {
      if (checkMetaMask()) {
        let registered = await auditBookContract.IsRegisteredAsAuditableCompany();
        setIsRegisteredAsAuditableCompany(registered);

        if (registered) {
          getAuditableCompanyName();
          getAuditableCompanySubmittedAuditsList();
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  const getAuditableCompanyName = async () => {
    try {
      if (checkMetaMask()) {
        let company = await auditBookContract.getAuditableCompanyRegister();
        let companyName = utils.parseBytes32String(company.name);
        inputValue.auditableCompanyName = companyName.toString();
        setAuditableCompanyCurrentState(company.state);
      }
    } catch (error) {
      console.log(error)
    }
  }

  const auditableCompanyRequestAdmisionHandler = async (event) => {
    event.preventDefault();
    try {
      if (checkMetaMask()) {
        const txn = await auditBookContract.AuditableCompanyRequestAdmision(utils.formatBytes32String(inputValue.auditableCompanyName));
        console.log("Init request admision...");
        await txn.wait();
        console.log("Finish request admision", txn.hash);
        checkIfAuditableCompanyIsRegistered();
        getAuditableCompaniesList();
      }
    } catch (error) {
      console.log(error)
    }
  }
  
  const getAuditableCompanySubmittedAuditsList = async () => {
    try {
      if (checkMetaMask()) {
        if (isAuditBookOwner) {
          let audits = await auditBookContract.getAuditableCompanySubmittedAudits();
          setAuditableCompanySubmittedAuditsList(audits);
        } else {
          setAuditableCompanySubmittedAuditsList(null);
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  const approveSubmittedAuditHandler = auditId => async () => {
    try {
      if (checkMetaMask()) {
        const txn = await auditBookContract.AuditableCompanyApproveSubmittedAudit(auditId);
        console.log("Init approval...");
        await txn.wait();
        console.log("Finish approval", txn.hash);
        getAuditableCompanySubmittedAuditsList();
      }
    } catch (error) {
      console.log(error)
    }
  }

  const rejectSubmittedAuditHandler = auditId => async () => {
    try {
      if (checkMetaMask()) {
        const txn = await auditBookContract.AuditableCompanyRejectSubmittedAudit(auditId);
        console.log("Init approval...");
        await txn.wait();
        console.log("Finish approval", txn.hash);
        getAuditableCompanySubmittedAuditsList();
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleInputChange = (event) => {
    if (event.target.name === "auditableCompanyAddress" || event.target.name === "auditFinding") {
      setSubmitAuditMessage("");
    }

    setInputValue(prevFormData => ({ ...prevFormData, [event.target.name]: event.target.value }));
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    getAdminName();
    getAuditBookOwnerHandler();
    checkIfAuditCompanyIsRegistered();
    checkIfAuditableCompanyIsRegistered();
  }, [isWalletConnected]);

  useEffect(() => {
    getAuditCompaniesList();
    getAuditableCompaniesList();
  }, [isWalletConnected, isAuditBookOwner]);

  return (
    <main className="main-container">
      <h2 className="headline"><span className="headline-gradient">Audit Book Project</span></h2>
      <section className="customer-section px-10 pt-5 pb-10">
        {error && <p className="text-2xl text-red-700">{error}</p>}
        <div className="mt-5">
          {currentAuditBookName === "" && isAuditBookOwner ?
            <p>"Setup the administrator's name." </p> :
            <p className="text-3xl font-bold">{currentAuditBookName}</p>
          }
        </div>
        <div className="mt-5">
          <p><span className="font-bold">Admin Address: </span>{auditBookOwnerAddress}</p>
        </div>
        <div className="mt-5">
          {isWalletConnected && <p><span className="font-bold">Your Wallet Address: </span>{customerAddress}</p>}
          <button className="btn-connect" onClick={checkIfWalletIsConnected}>
            {isWalletConnected ? "Wallet Connected 🔒" : "Connect Wallet 🔑"}
          </button>
        </div>
      </section>
      {
        isAuditBookOwner && (
          <section className="owner-section">
            <h2 className="text-xl border-b-2 border-indigo-500 px-10 py-4 font-bold">Audit Book Panel</h2>
            <div className="p-10">
              <form className="form-style">
                <input
                  type="text"
                  className="input-style"
                  onChange={handleInputChange}
                  name="adminName"
                  placeholder="Enter the Admin name"
                  value={inputValue.adminName}
                />
                <button
                  className="btn-grey"
                  onClick={setAdminNameHandler}>
                  Set Admin Name
                </button>
              </form>
            </div>
              {
                auditCompaniesList !== null && auditCompaniesList.length > 0 && (
                  <div className="owner-section">
                    <h2 className="text-xl border-b-2 border-indigo-500 px-10 py-4 font-bold">Audit Companies</h2>
                    <div className="p-10">
                      <ul>
                        {auditCompaniesList.map(function(company, index){
                            return <li>
                                { utils.parseBytes32String(company.name) }&nbsp;
                                ({ StateTypeEnum[company.state] })&nbsp;
                                { 
                                  (company.state === STATE_PENDING || company.state === STATE_REJECTED) &&
                                  (
                                    <span>
                                      <button
                                        className="btn-grey"
                                        onClick={approveAuditCompanyHandler(company.account)}>
                                        Approve
                                      </button>
                                    </span>
                                  )
                                }
                                &nbsp;
                                { 
                                  (company.state === STATE_PENDING) &&
                                  (
                                    <span>
                                      <button
                                        className="btn-grey"
                                        onClick={rejectAuditCompanyHandler(company.account)}>
                                        Reject
                                      </button>
                                    </span>
                                  )
                                }
                              </li>;
                          })}
                      </ul>              
                    </div>
                  </div>
                )
              }
              {
                auditableCompaniesList !== null && auditableCompaniesList.length > 0 && (
                  <div className="owner-section">
                    <h2 className="text-xl border-b-2 border-indigo-500 px-10 py-4 font-bold">Auditable Companies</h2>
                    <div className="p-10">
                      <ul>
                        {auditableCompaniesList.map(function(company, index){
                            return <li>
                                { utils.parseBytes32String(company.name) }&nbsp;
                                ({ StateTypeEnum[company.state] })&nbsp;
                                { 
                                  (company.state === STATE_PENDING || company.state === STATE_REJECTED) &&
                                  (
                                    <span>
                                      <button
                                        className="btn-grey"
                                        onClick={approveAuditableCompanyHandler(company.account)}>
                                        Approve
                                      </button>
                                    </span>
                                  )
                                }
                                &nbsp;
                                { 
                                  (company.state === STATE_PENDING) &&
                                  (
                                    <span>
                                      <button
                                        className="btn-grey"
                                        onClick={rejectAuditableCompanyHandler(company.account)}>
                                        Reject
                                      </button>
                                    </span>
                                  )
                                }
                              </li>;
                          })}
                      </ul>              
                    </div>
                  </div>
                )
              }
          </section>
        )
      }
      {
        !isRegisteredAsAuditCompany && (
          <section className="owner-section">
            <h2 className="text-xl border-b-2 border-indigo-500 px-10 py-4 font-bold">Audit Company - Request Admision</h2>
            <div className="p-10">
              <form className="form-style">
                <input
                  type="text"
                  className="input-style"
                  onChange={handleInputChange}
                  name="auditCompanyName"
                  placeholder="Enter the company name"
                  value={inputValue.auditCompanyName}
                />
                <button
                  className="btn-grey"
                  onClick={auditCompanyRequestAdmisionHandler}>
                  Request admision
                </button>
              </form>
            </div>
          </section>
        )
      }
      {
        isRegisteredAsAuditCompany && (
          <section className="owner-section">
            <h2 className="text-xl border-b-2 border-indigo-500 px-10 py-4 font-bold">Audit company name: {inputValue.auditCompanyName} - {StateTypeEnum[auditCompanyCurrentState]}</h2>
            
            {
              approvedAuditableCompaniesList !== null && approvedAuditableCompaniesList.length > 0 && auditCompanyCurrentState === STATE_APPROVED && (
                <div className="mt-10">
                  <div className="owner-section">
                    <h2 className="text-xl border-b-2 border-indigo-500 px-10 py-4 font-bold">Submit Audit</h2>
                      <div>
                        <div className="p-2">
                          <select className="input-style-v2" name="auditableCompanyAddress" onChange={handleInputChange}> 
                            <option value="">Select a company</option>
                            {approvedAuditableCompaniesList.map((company) => <option value={company.account}>{ utils.parseBytes32String(company.name) }</option>)}
                          </select>
                        </div>
                        <div className="p-2">
                          <textarea
                          type="text"
                          className="input-style-v2"
                          onChange={handleInputChange}
                          name="auditFinding"
                          placeholder="Enter the finding"
                          value={inputValue.auditFinding}
                          />
                        </div>
                        <div className="p-2">
                          <button
                            className="btn-grey"
                            onClick={submitAuditHandler}>
                            Submit Audit
                          </button>
                        </div>
                      </div>
                  </div>
                  <div className="submit-audit-message">
                    {submitAuditMessage}
                  </div>
                </div>
              )
            }

          </section>
        )
      }
      {
        !isRegisteredAsAuditableCompany && (
          <section className="owner-section">
            <h2 className="text-xl border-b-2 border-indigo-500 px-10 py-4 font-bold">Auditable Company - Request Admision</h2>
            <div className="p-10">
              <form className="form-style">
                <input
                  type="text"
                  className="input-style"
                  onChange={handleInputChange}
                  name="auditableCompanyName"
                  placeholder="Enter the company name"
                  value={inputValue.auditableCompanyName}
                />
                <button
                  className="btn-grey"
                  onClick={auditableCompanyRequestAdmisionHandler}>
                  Request admision
                </button>
              </form>
            </div>
          </section>
        )
      }
      {
        isRegisteredAsAuditableCompany && (
          <section className="owner-section">
            <h2 className="text-xl border-b-2 border-indigo-500 px-10 py-4 font-bold">Auditable company name: {inputValue.auditableCompanyName} - {StateTypeEnum[auditableCompanyCurrentState]}</h2>
              {
                auditableCompanySubmittedAuditsList !== null && auditableCompanySubmittedAuditsList.length > 0 && auditableCompanyCurrentState !== null && auditableCompanyCurrentState === STATE_APPROVED && (
                  <div className="owner-section mt-10">
                    <h2 className="text-xl border-b-2 border-indigo-500 px-10 py-4 font-bold">Auditable Companies</h2>
                    <div className="p-2">
                      <table className="table-auto border-collapse border border-slate-400">
                        <thead>
                          <th className="border border-slate-300">Finding</th>
                          <th className="border border-slate-300">Action</th>
                        </thead>
                        <tbody>
                          {auditableCompanySubmittedAuditsList.map(function(audit, index){
                            return <tr>
                                <td className="border border-slate-300">{ utils.parseBytes32String(audit.finding) }</td>
                                <td className="border border-slate-300">
                                  { 
                                    (audit.state === AUDIT_STATE_SUBMITTED) &&
                                    (
                                      <span>
                                        <span className="p-2">
                                          <button
                                            className="btn-grey"
                                            onClick={approveSubmittedAuditHandler(audit.id)}>
                                            Approve
                                          </button>
                                        </span>
                                        <span className="p-2">
                                          <button
                                            className="btn-grey"
                                            onClick={rejectSubmittedAuditHandler(audit.id)}>
                                            Reject
                                          </button>
                                        </span>
                                      </span>
                                    )
                                  }
                                </td>
                              </tr>
                          })}
                        </tbody>
                        </table>
                    </div>
                  </div>
                )
              }
          </section>
        )
      }
    </main>
  );
}
export default App;
