// import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
// import { useParams,useSearchParams }      from "react-router-dom"
// import { CustomerFormConfig } from "../config/customerForm";
// import { useClientData } from "../hooks/useRepoMaster";
// import { useMasterData } from "../../../core/master/masterCall/useMasterData";

// const CustomerCreatePage = () => {
//     const{repoId}=useParams();
//     const[searchParams]=useSearchParams();
//     const editUserName=searchParams.get("UserName");
//     const editRepoKey=searchParams.get("RepoKey");
//     const isEdit = !!editUserName;

//   const { data:useClientDataWrapper } = useClientData(repoId)

//   const config = [];
//   const {data} = useMasterData(config);
  
// const entityData =
//   isEdit && Array.isArray(useClientDataWrapper)
//     ? useClientDataWrapper.find((c) => c.UserId === editUserId)
//     : null;

//       const dynamicConfig = {
//         ...CustomerFormConfig,
//         api: isEdit ? "/Customer/PutCustomer" : "/Customer/PostCustomer",
       
//       };
      

//     return (
//       <div>
//         <h2>{isEdit ? "Edit Employee" : "Create Employee"}</h2>
//         <EntityFormPage
//           mode={isEdit ? "Update" : "Create"}
//           config={dynamicConfig}
//           context={{ params:{repoId,editUserName,editRepoKey}, isEdit, entityData, data }}
//           module="Customer"
//         />
//       </div>
//     )
//   }
  
// export default CustomerCreatePage;


import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { useParams, useSearchParams } from "react-router-dom";
import { CustomerFormConfig } from "../config/customerForm";
import { useClientData } from "../hooks/useRepoMaster";
import { useMasterData } from "../../../core/master/masterCall/useMasterData";

const CustomerCreatePage = () => {
  const params = useParams();
  const repoId=params.repoId
  const userId=params.userId
  const isEdit = !!userId;
 
  const { data: useClientDataWrapper } = useClientData(repoId);
  // const currentRepo=data?.RepoList?.find(repo=>repo.Repo_Id===repoId);
  // const RepoKey=currentRepo?.RepoKey||"";
  const entityData =
    isEdit && Array.isArray(useClientDataWrapper)
      ? useClientDataWrapper.find((c) => c.UserId=== userId)||null
      : null;

  const dynamicConfig = {
    ...CustomerFormConfig,
    api: isEdit ? `Customer/PutCostomer/${userId}` : CustomerFormConfig.api,
  };
  
  return (
    <div>
      <h2>{isEdit ? "Edit Customer" : "Create Customer"}</h2>
      <EntityFormPage
        mode={isEdit ? "Update" : "Create"}
        config={dynamicConfig}
        context={{  params,isEdit, entityData,repoId }}
        module="Customer"
      />
    </div>
  );
};

export default CustomerCreatePage;
