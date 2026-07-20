/** 服务流程管理端客户端 + query keys。 */
import {
  createAgentLinkRequest,
  createMaterialRequest,
  createNodeRequest,
  createServiceCategoryRequest,
  createServiceRequest,
  createSystemRequest,
  deleteAgentLinkRequest,
  deleteMaterialRequest,
  deleteNodeRequest,
  deleteServiceCategoryRequest,
  deleteServiceRequest,
  deleteSystemRequest,
  exportWorkbookRequest,
  getServiceDetailRequest,
  importWorkbookRequest,
  listAgentLinksRequest,
  listMaterialsRequest,
  listNodesRequest,
  listServiceCategoriesRequest,
  listServicesRequest,
  listSystemsRequest,
  reorderNodesRequest,
  updateAgentLinkRequest,
  updateMaterialRequest,
  updateNodeRequest,
  updateServiceCategoryRequest,
  updateServiceRequest,
  updateSystemRequest,
  type ServiceAgentLink,
  type ServiceAgentLinkCreate,
  type ServiceAgentLinkUpdate,
  type ServiceCategory,
  type ServiceCategoryCreate,
  type ServiceCategoryUpdate,
  type ServiceDefinition,
  type ServiceDefinitionCreate,
  type ServiceDefinitionUpdate,
  type ServiceDetailPublic,
  type ServiceImportResult,
  type ServiceLevel,
  type ServiceListQuery,
  type ServiceListResult,
  type ServiceNodeMaterial,
  type ServiceNodeMaterialCreate,
  type ServiceNodeMaterialUpdate,
  type ServiceProcessNode,
  type ServiceProcessNodeCreate,
  type ServiceProcessNodeUpdate,
  type ServiceRelatedSystem,
  type ServiceRelatedSystemCreate,
  type ServiceRelatedSystemUpdate,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  ServiceAgentLink,
  ServiceAgentLinkCreate,
  ServiceAgentLinkUpdate,
  ServiceCategory,
  ServiceCategoryCreate,
  ServiceCategoryUpdate,
  ServiceDefinition,
  ServiceDefinitionCreate,
  ServiceDefinitionUpdate,
  ServiceDetailPublic,
  ServiceImportResult,
  ServiceLevel,
  ServiceListQuery,
  ServiceListResult,
  ServiceNodeMaterial,
  ServiceNodeMaterialCreate,
  ServiceNodeMaterialUpdate,
  ServiceProcessNode,
  ServiceProcessNodeCreate,
  ServiceProcessNodeUpdate,
  ServiceRelatedSystem,
  ServiceRelatedSystemCreate,
  ServiceRelatedSystemUpdate,
}

export const serviceCatalogKeys = {
  all: ['service-catalog'] as const,
  categories: () => [...serviceCatalogKeys.all, 'categories'] as const,
  services: (query: ServiceListQuery) => [...serviceCatalogKeys.all, 'services', query] as const,
  service: (id: string) => [...serviceCatalogKeys.all, 'service', id] as const,
  nodes: (serviceId: string) => [...serviceCatalogKeys.all, 'service', serviceId, 'nodes'] as const,
  materials: (nodeId: string) => [...serviceCatalogKeys.all, 'node', nodeId, 'materials'] as const,
  systems: (serviceId: string) => [...serviceCatalogKeys.all, 'service', serviceId, 'systems'] as const,
  agentLinks: (serviceId: string) => [...serviceCatalogKeys.all, 'service', serviceId, 'agent-links'] as const,
}

// Categories
export const serviceCategories_list = request(listServiceCategoriesRequest)
export const serviceCategory_create = request(createServiceCategoryRequest)
export const serviceCategory_update = request(updateServiceCategoryRequest)
export const serviceCategory_delete = request(deleteServiceCategoryRequest)

// Services
export const serviceCatalogServices_list = request(listServicesRequest)
export const serviceCatalogService_create = request(createServiceRequest)
export const serviceCatalogService_get = request(getServiceDetailRequest)
export const serviceCatalogService_update = request(updateServiceRequest)
export const serviceCatalogService_delete = request(deleteServiceRequest)

// Nodes
export const serviceNodes_list = request(listNodesRequest)
export const serviceNode_create = request(createNodeRequest)
export const serviceNode_update = request(updateNodeRequest)
export const serviceNodes_reorder = request(reorderNodesRequest)
export const serviceNode_delete = request(deleteNodeRequest)

// Materials
export const serviceMaterials_list = request(listMaterialsRequest)
export const serviceMaterial_create = request(createMaterialRequest)
export const serviceMaterial_update = request(updateMaterialRequest)
export const serviceMaterial_delete = request(deleteMaterialRequest)

// Systems
export const serviceSystems_list = request(listSystemsRequest)
export const serviceSystem_create = request(createSystemRequest)
export const serviceSystem_update = request(updateSystemRequest)
export const serviceSystem_delete = request(deleteSystemRequest)

// Agent Links
export const serviceAgentLinks_list = request(listAgentLinksRequest)
export const serviceAgentLink_create = request(createAgentLinkRequest)
export const serviceAgentLink_update = request(updateAgentLinkRequest)
export const serviceAgentLink_delete = request(deleteAgentLinkRequest)

// Import / Export
export const serviceCatalog_export = request(exportWorkbookRequest)
export const serviceCatalog_import = request(importWorkbookRequest)
